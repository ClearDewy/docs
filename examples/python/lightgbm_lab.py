"""CPU-only synthetic regression, oracle checks and a save/reload round trip."""
import json
import platform
from pathlib import Path
from tempfile import TemporaryDirectory

import lightgbm as lgb
import numpy as np
import sklearn
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import GradientBoostingRegressor

from tree_boosting import CARTRegressor, SquaredGBDT, X_TOY, Y_TOY


def oracle_checks():
    X, y = np.array(X_TOY), np.array(Y_TOY)
    ours = CARTRegressor(1).fit(X_TOY, Y_TOY)
    oracle = DecisionTreeRegressor(max_depth=1, random_state=7).fit(X, y)
    probe = [[0.0], [1.5], [2.5], [3.5], [5.0]]
    np.testing.assert_allclose(ours.predict(probe), oracle.predict(probe))
    assert oracle.tree_.threshold[0] == ours.root.threshold
    ours_boost = SquaredGBDT().fit(X_TOY, Y_TOY)
    oracle_boost = GradientBoostingRegressor(n_estimators=2, learning_rate=0.5, max_depth=1, random_state=7).fit(X, y)
    np.testing.assert_allclose(ours_boost.predict(probe), oracle_boost.predict(probe))
    # More than a single hand-picked split: compare a multi-feature nonlinear dataset.
    rng = np.random.default_rng(13)
    many_X = rng.normal(size=(80, 3))
    many_y = np.where(many_X[:, 1] > 0.2, 3.0, -1.0) + 0.3 * many_X[:, 2]
    ours_many = CARTRegressor(3, 4).fit(many_X.tolist(), many_y.tolist())
    oracle_many = DecisionTreeRegressor(max_depth=3, min_samples_leaf=4, random_state=7).fit(many_X, many_y)
    np.testing.assert_allclose(ours_many.predict(many_X.tolist()), oracle_many.predict(many_X), atol=1e-12)
    data = lgb.Dataset(X, label=y, params={'min_data_in_bin': 1})
    toy = lgb.train({
        'objective': 'regression', 'learning_rate': 0.5, 'num_leaves': 2,
        'max_depth': 1, 'min_data_in_leaf': 1, 'min_sum_hessian_in_leaf': 0.0,
        'lambda_l1': 0.0, 'lambda_l2': 0.0, 'min_data_in_bin': 1,
        'max_bin': 255, 'verbosity': -1, 'num_threads': 1,
        'deterministic': True, 'force_col_wise': True,
    }, data, num_boost_round=2)
    np.testing.assert_allclose(toy.predict(X), ours_boost.predict(X_TOY), atol=1e-12)
    # Inspect learned routing independently of the score comparison.
    root = toy.dump_model()['tree_info'][0]['tree_structure']
    assert root['split_feature'] == 0 and abs(root['threshold'] - 2.5) < 1e-12
    assert abs(root['split_gain'] - 4.0) < 1e-6
    regularized_params = dict(toy.params, lambda_l2=1.0)
    # Booster.params includes normalized num_iterations; it overrides the argument.
    regularized_params.pop('num_iterations', None)
    regularized = lgb.train(regularized_params, data, num_boost_round=1)
    np.testing.assert_allclose(regularized.predict(X), [5 / 3, 5 / 3, 7 / 3, 7 / 3], atol=1e-12)
    regularized_gain = regularized.dump_model()['tree_info'][0]['tree_structure']['split_gain']
    # The returned model's gain metadata has lower precision than predictions.
    assert abs(regularized_gain - 8 / 3) < 1e-5
    print('CART / sklearn, GBDT / sklearn, GBDT / LightGBM oracle checks passed')
    print('toy first tree:', json.dumps(root, sort_keys=True))


def main():
    oracle_checks()
    rng = np.random.default_rng(7)
    X = rng.uniform(-2.0, 2.0, size=(900, 3))
    y = 2 * (X[:, 0] > 0) + 0.5 * X[:, 1] ** 2 + rng.normal(0, 0.15, 900)
    # Independently generated IID rows: no real-world time or entity semantics.
    X_train, X_valid, X_test = X[:500], X[500:700], X[700:]
    y_train, y_valid, y_test = y[:500], y[500:700], y[700:]
    train = lgb.Dataset(X_train, label=y_train, feature_name=['step', 'curve', 'noise'])
    valid = lgb.Dataset(X_valid, label=y_valid, reference=train)
    params = {
        'objective': 'regression', 'metric': 'l2', 'learning_rate': 0.05,
        'num_leaves': 7, 'max_depth': 3, 'min_data_in_leaf': 20,
        'lambda_l2': 1.0, 'max_bin': 63, 'seed': 7,
        'num_threads': 1, 'deterministic': True, 'force_col_wise': True,
        'verbosity': -1,
    }
    history = {}
    booster = lgb.train(
        params, train, num_boost_round=400, valid_sets=[valid], valid_names=['valid'],
        callbacks=[lgb.early_stopping(30, first_metric_only=True, verbose=False), lgb.record_evaluation(history)],
    )
    best = booster.best_iteration
    assert 1 <= best <= 400
    assert best == int(np.argmin(history['valid']['l2'])) + 1
    prediction = booster.predict(X_test, num_iteration=best)
    baseline_mse = float(np.mean((y_test - np.mean(y_train)) ** 2))
    test_mse = float(np.mean((y_test - prediction) ** 2))
    assert test_mse < 0.2 * baseline_mse  # Fixed synthetic task, not a universal promise.
    with TemporaryDirectory(prefix='docs-lightgbm-') as directory:
        model_path = Path(directory) / 'model.txt'
        booster.save_model(str(model_path), num_iteration=best)
        restored = lgb.Booster(model_file=str(model_path))
        reloaded_prediction = restored.predict(X_test)
        reload_error = float(np.max(np.abs(reloaded_prediction - prediction)))
        np.testing.assert_allclose(reloaded_prediction, prediction, rtol=0, atol=1e-12)
    print(json.dumps({
        'python': platform.python_version(), 'lightgbm': lgb.__version__,
        'numpy': np.__version__, 'sklearn': sklearn.__version__,
        'best_iteration': best, 'evaluated_rounds': len(history['valid']['l2']),
        'baseline_test_mse': baseline_mse, 'model_test_mse': test_mse,
        'reload_max_abs_error': reload_error,
    }, indent=2))
    print('synthetic validation and model reload passed; temporary model removed')


if __name__ == '__main__':
    main()
