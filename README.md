# route-service

세 프로젝트(`on-time-route-ui`, `hackathon-route-data-layer`, `Newbiethon33`)와
`REALTIME_DEADLINE_ROUTING_ALGORITHM.md`(DARTS)를 하나로 합친 서비스입니다.

## 구성

- `src/components`, `src/hooks/use-trip-demo.ts`, `src/types/trip.ts` — UI (구 on-time-route-ui)
- `src/lib/routes`, `src/lib/location`, `src/lib/places`, `src/app/api/routes`, `src/app/api/places` — 위치·경로 데이터 레이어 (구 hackathon-route-data-layer)
- `src/lib/algorithm/*` — DARTS 알고리즘 구현 (신규, `REALTIME_DEADLINE_ROUTING_ALGORITHM.md` 기반)
- `src/app/api/evaluate` — 후보 경로 조회 + DARTS 평가를 합친 서버 API
- `src/services/trip-service.ts` — `ApiTripService`가 위 API를 호출해 UI가 쓰는 `TripSnapshot`으로 변환

## 실행 방법

```bash
npm install
cp .env.example .env.local   # Windows: Copy-Item .env.example .env.local
npm run dev
```

`http://localhost:3000` 접속. **API 키가 없어도 그대로 동작합니다** — `lib/routes/service.ts`가
Kakao/ODsay 호출 실패를 자동으로 감지해 Mock 경로 데이터로 전환하고, DARTS 평가 코드는 실제 데이터와
동일한 방식으로 그 Mock 데이터를 평가합니다.

데모에서 검색 가능한 목적지(Mock 장소 DB): `서울역`, `고려대학교`, `강남역`, `서울시청`.

## API 키가 준비되면

`.env.local`에 아래 값을 채우고 개발 서버를 재시작하면 실제 데이터로 자동 전환됩니다. 코드 변경은
필요 없습니다.

```dotenv
NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY=
KAKAO_REST_API_KEY=
ODSAY_API_KEY=
```

## 알고리즘 모듈 (`src/lib/algorithm`)

| 파일 | 역할 (문서 섹션) |
| --- | --- |
| `distribution.ts` | 신선도/신뢰도 계산, 모드별 경험적 `TimeDistribution` 합성 (§5-A) |
| `policyBuilder.ts` | `RawRoute` → `RoutePolicy` 변환, 중복 후보 제거, 정책 단위 fallback 지정 (§5-C) |
| `simulate.ts` | 정책별 500회 몬테카를로 시뮬레이션, 공유 정체 변수 적용 (§5-E) |
| `risk.ts` | `calculateRiskLevel` (§6) |
| `selectPolicy.ts` | 하드 제약, 확률 목표, 사전식 비교, 전환 히스테리시스 (§5-G, §5-H) |
| `actionComposer.ts` | 다음 행동/이유/실행 시각/fallback 생성 (§5-I) |
| `replanScheduler.ts` | 위험도별 재평가 주기 (§7) |
| `evaluateTrip.ts` | 위 모듈을 묶는 단일 진입점 (§8 runDarts의 API 버전) |

## 알려진 MVP 단순화

- 사용자별 도보 속도 학습(§5-B), 실제 이동편 단위 fallback(§4 FallbackBranch)은 정책 단위 fallback으로 단순화했습니다.
- 전환 확인 횟수·쿨다운(§5-H)은 서버 메모리의 트립 세션에 저장하며, 서버 재시작 시 초기화됩니다(DB 없음).
- ODsay는 서버 발신 IP를 등록해야 하므로 Vercel 같은 서버리스 배포에서는 대중교통 경로가 계속 Mock으로 전환될 수 있습니다.
