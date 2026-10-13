# 오늘 뭐 먹지? 점심 룰렛

룰렛으로 점심 메뉴를 고르고, 팀별 투표 순위를 공유하는 임시 웹 앱입니다. 투표는 컨테이너 메모리에만 저장되며 서비스가 종료되면 함께 사라집니다.

## Docker로 실행

```bash
docker compose up --build -d
```

브라우저에서 <http://localhost:4173>을 엽니다. 컨테이너 로그에 표시되는 임시 공개 URL은 실행 후 1시간 동안만 동작합니다.

```bash
docker compose logs -f
```

웹서버, 투표 API, 공개 터널은 같은 컨테이너에서 실행됩니다. 1시간이 지나거나 컨테이너를 종료하면 모두 함께 종료됩니다.

```bash
docker compose down
```

## Supabase 연결

1. Supabase SQL Editor에서 `supabase.sql`을 실행합니다.
2. `config.js`에 Project URL과 Publishable/anon key를 입력합니다.
3. 컨테이너를 다시 빌드합니다.

키가 비어 있으면 브라우저의 `localStorage`를 이용하는 연습 모드로 자동 동작합니다.

## 팀별 투표

URL에 `?team=팀이름`을 붙이면 팀별로 순위가 나뉩니다.

예: `http://localhost:4173/?team=마케팅`
