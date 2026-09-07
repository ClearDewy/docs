"""确定性检索与引用实验：不调用 LLM，输出原文摘录而非模拟生成。"""
from datetime import date

DOCUMENTS = [
    dict(id='travel-2025', start='2025-01-01', end='2026-01-01', acl='staff',
         sections=['住宿：每晚报销上限 300 元。', '餐饮：每日报销上限 80 元。']),
    dict(id='travel-2026', start='2026-01-01', end='2027-01-01', acl='staff',
         sections=['住宿：每晚报销上限 400 元。', '餐饮：每日报销上限 100 元。']),
    dict(id='executive-2026', start='2026-01-01', end='2027-01-01', acl='executive',
         sections=['住宿：每晚报销上限 800 元。']),
]
TERMS = ('住宿', '餐饮', '报销', '上限')


def retrieve(question, role='staff', as_of='2026-09-06'):
    day = date.fromisoformat(as_of)
    query_terms = {term for term in TERMS if term in question}
    chunks = []
    for doc in DOCUMENTS:
        if doc['acl'] != role or not date.fromisoformat(doc['start']) <= day < date.fromisoformat(doc['end']):
            continue  # 在排序/返回候选前过滤，权限不依赖模型判断。
        for index, text in enumerate(doc['sections'], 1):
            chunks.append(dict(id=f"{doc['id']}:s{index}", text=text, source=doc['id'], section=index,
                               score=sum(term in text for term in query_terms)))
    candidates = sorted(chunks, key=lambda row: (-row['score'], row['id']))
    # 本实验只回答两类明确费用；泛泛的“报销”不能强行选中某一类。
    topic = next((word for word in ('住宿', '餐饮') if word in question), None)
    hits = [row for row in candidates if row['score'] > 0 and topic and topic in row['text']]
    return candidates, hits[:1]


def answer(question, role='staff', as_of='2026-09-06'):
    candidates, context = retrieve(question, role, as_of)
    if not context:
        return candidates, '没有找到当前身份可用的对应证据。', {}
    row = context[0]
    return candidates, f"证据摘录：{row['text']} [1]", {'1': row['id']}


def main():
    for question, role, day in [
        ('住宿报销上限是多少？', 'staff', '2026-09-06'),
        ('住宿报销上限是多少？', 'staff', '2025-06-01'),
        ('住宿报销上限是多少？', 'guest', '2026-09-06'),
        ('交通报销上限是多少？', 'staff', '2026-09-06'),
    ]:
        candidates, result, citations = answer(question, role, day)
        print('\nquery:', question, role, day)
        print('candidates:', [(row['id'], row['score']) for row in candidates])
        print(result, citations)
    assert answer('住宿报销上限是多少？')[2] == {'1': 'travel-2026:s1'}
    assert '400' in answer('住宿报销上限是多少？')[1]
    assert not answer('住宿报销上限是多少？', 'guest')[2]
    assert not answer('交通报销上限是多少？')[2]
    assert all(not row['id'].startswith('executive') for row in retrieve('住宿报销上限是多少？')[0])
    print('\n版本、权限、引用映射与无证据路径通过')


if __name__ == '__main__':
    main()
