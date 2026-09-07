"""Readable numeric CART and squared-loss GBDT; no third-party dependencies.

This is an exact-search teaching implementation, not a LightGBM replacement.
Run from the repository root: python3 examples/python/tree_boosting.py
"""
from dataclasses import dataclass
from math import isfinite


X_TOY = [[1.0], [2.0], [3.0], [4.0]]
Y_TOY = [1.0, 1.0, 3.0, 3.0]


def mean(values):
    return sum(values) / len(values)


def sse(values):
    center = mean(values)
    return sum((value - center) ** 2 for value in values)


def mse(actual, predicted):
    if not actual or len(actual) != len(predicted):
        raise ValueError("MSE requires equal, nonempty sequences")
    return mean([(a - p) ** 2 for a, p in zip(actual, predicted)])


def validate(X, y):
    if not X or len(X) != len(y) or not X[0]:
        raise ValueError("X and y must have matching nonzero sample counts")
    width = len(X[0])
    if any(len(row) != width for row in X):
        raise ValueError("X must be rectangular")
    if any(not isfinite(v) for row in X for v in row) or any(not isfinite(v) for v in y):
        raise ValueError("This teaching tree accepts only finite numeric values")


@dataclass
class Node:
    value: float
    count: int
    feature: object = None
    threshold: object = None
    gain: float = 0.0
    left: object = None
    right: object = None


class CARTRegressor:
    def __init__(self, max_depth=2, min_samples_leaf=1, min_gain=0.0):
        if not isinstance(max_depth, int) or max_depth < 0:
            raise ValueError("max_depth must be a nonnegative integer")
        if not isinstance(min_samples_leaf, int) or min_samples_leaf < 1:
            raise ValueError("min_samples_leaf must be a positive integer")
        if not isfinite(min_gain) or min_gain < 0:
            raise ValueError("min_gain must be finite and nonnegative")
        self.max_depth = max_depth
        self.min_samples_leaf = min_samples_leaf
        self.min_gain = min_gain
        self.root = None

    def fit(self, X, y):
        validate(X, y)
        self.n_features = len(X[0])

        def build(indices, depth):
            labels = [y[i] for i in indices]
            node = Node(mean(labels), len(indices))
            parent_sse = sse(labels)
            if depth >= self.max_depth or len(indices) < 2 * self.min_samples_leaf:
                return node
            best = None
            best_gain = self.min_gain
            for feature in range(self.n_features):
                values = sorted({X[i][feature] for i in indices})
                for low, high in zip(values, values[1:]):
                    threshold = low / 2 + high / 2
                    left = [i for i in indices if X[i][feature] <= threshold]
                    right = [i for i in indices if X[i][feature] > threshold]
                    if min(len(left), len(right)) < self.min_samples_leaf:
                        continue
                    gain = parent_sse - sse([y[i] for i in left]) - sse([y[i] for i in right])
                    # Strict improvement: deterministic first candidate wins ties.
                    if gain > best_gain:
                        best_gain = gain
                        best = feature, threshold, left, right
            if best is not None:
                feature, threshold, left, right = best
                node.feature, node.threshold, node.gain = feature, threshold, best_gain
                node.left, node.right = build(left, depth + 1), build(right, depth + 1)
            return node

        self.root = build(list(range(len(y))), 0)
        return self

    def predict(self, X):
        if self.root is None:
            raise ValueError("Call fit before predict")
        if any(len(row) != self.n_features or any(not isfinite(v) for v in row) for row in X):
            raise ValueError("Prediction features must match training width and be finite")
        result = []
        for row in X:
            node = self.root
            while node.feature is not None:
                node = node.left if row[node.feature] <= node.threshold else node.right
            result.append(node.value)
        return result


class SquaredGBDT:
    def __init__(self, n_estimators=2, learning_rate=0.5, max_depth=1, min_samples_leaf=1):
        if not isinstance(n_estimators, int) or n_estimators < 1:
            raise ValueError("n_estimators must be positive")
        if not isfinite(learning_rate) or not 0 < learning_rate <= 1:
            raise ValueError("Teaching implementation requires 0 < learning_rate <= 1")
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.min_samples_leaf = min_samples_leaf
        self.trees = []
        self.base = None

    def fit(self, X, y):
        validate(X, y)
        self.base, self.trees = mean(y), []
        prediction = [self.base] * len(y)
        self.train_mse = [mse(y, prediction)]
        self.trace = []
        for _ in range(self.n_estimators):
            residual = [a - p for a, p in zip(y, prediction)]
            tree = CARTRegressor(self.max_depth, self.min_samples_leaf).fit(X, residual)
            correction = tree.predict(X)
            prediction = [p + self.learning_rate * c for p, c in zip(prediction, correction)]
            self.trees.append(tree)
            self.train_mse.append(mse(y, prediction))
            self.trace.append({"residual": residual, "correction": correction, "prediction": prediction[:]})
        return self

    def predict(self, X):
        if self.base is None:
            raise ValueError("Call fit before predict")
        prediction = [self.base] * len(X)
        for tree in self.trees:
            prediction = [p + self.learning_rate * c for p, c in zip(prediction, tree.predict(X))]
        return prediction


def self_check():
    tree = CARTRegressor(max_depth=1).fit(X_TOY, Y_TOY)
    assert tree.root.threshold == 2.5 and tree.root.gain == 4.0
    assert tree.predict(X_TOY) == Y_TOY
    assert tree.predict([[0.0], [2.5], [5.0]]) == [1.0, 1.0, 3.0]
    assert CARTRegressor(max_depth=0).fit(X_TOY, Y_TOY).predict(X_TOY) == [2.0] * 4
    assert CARTRegressor(min_samples_leaf=3).fit(X_TOY, Y_TOY).root.feature is None
    assert CARTRegressor().fit(X_TOY, [7.0] * 4).root.feature is None
    assert CARTRegressor().fit([[1.0]] * 4, Y_TOY).root.feature is None
    # Changed labels must produce changed learned values, not hard-coded toy answers.
    changed = [2 * y + 5 for y in Y_TOY]
    assert CARTRegressor(1).fit(X_TOY, changed).predict(X_TOY) == changed
    duplicates = CARTRegressor(1).fit([[1.0], [1.0], [2.0], [2.0]], Y_TOY)
    assert duplicates.root.threshold == 1.5
    multi = CARTRegressor(1).fit([[0.0, x[0]] for x in X_TOY], Y_TOY)
    assert multi.root.feature == 1
    for bad_X, bad_y in [([], []), ([[1.0]], []), ([[float('nan')]], [1.0]), ([[1.0], []], [1.0, 2.0])]:
        try:
            CARTRegressor().fit(bad_X, bad_y)
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid input should be rejected")
    model = SquaredGBDT().fit(X_TOY, Y_TOY)
    assert model.train_mse == [1.0, 0.25, 0.0625]
    assert model.predict(X_TOY) == [1.25, 1.25, 2.75, 2.75]
    assert model.trace[1]['residual'] == [-0.5, -0.5, 0.5, 0.5]
    slower = SquaredGBDT(learning_rate=0.1).fit(X_TOY, Y_TOY)
    assert slower.train_mse[-1] > model.train_mse[-1]
    assert abs(slower.train_mse[-1] - 0.6561) < 1e-12
    assert SquaredGBDT(n_estimators=3).fit(X_TOY, Y_TOY).train_mse[-1] == 0.015625
    model.fit(X_TOY, changed)
    assert len(model.trees) == 2  # Refit must reset previous trees.
    assert model.predict(X_TOY) == [7.5, 7.5, 10.5, 10.5]
    # Newton statistics for the same toy residuals, lambda_l2=1.
    g_left, h_left, g_right, h_right = 2.0, 2.0, -2.0, 2.0
    improvement = 0.5 * (g_left ** 2 / (h_left + 1) + g_right ** 2 / (h_right + 1))
    assert abs(improvement - 4 / 3) < 1e-12
    print('CART split=2.5, gain(SSE)=4.0, prediction=[1.0, 1.0, 3.0, 3.0]')
    original = SquaredGBDT().fit(X_TOY, Y_TOY)
    for index, row in enumerate(original.trace, 1):
        print(f'round {index}: {row}')
    print(f'train MSE={original.train_mse}')
    print('tree and boosting variants passed')


if __name__ == '__main__':
    self_check()
