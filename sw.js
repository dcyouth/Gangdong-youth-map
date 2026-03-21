const CACHE_NAME = 'gd-youth-map-v1';
const STATIC_ASSETS = [
  '/Gangdong-youth-map/',
  '/Gangdong-youth-map/index.html',
];

// 설치: 정적 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: 네트워크 우선 → 실패 시 캐시
self.addEventListener('fetch', e => {
  // 구글 시트 API는 항상 네트워크 (캐시 X)
  if(e.request.url.includes('script.google.com')) return;
  // 카카오맵 API는 항상 네트워크 (캐시 X)
  if(e.request.url.includes('kakao')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 성공 시 캐시 업데이트
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => {
        // 오프라인 시 캐시에서 반환
        return caches.match(e.request).then(cached => {
          if(cached) return cached;
          // 캐시도 없으면 index.html 반환 (기본 오프라인 페이지)
          return caches.match('/Gangdong-youth-map/index.html');
        });
      })
  );
});
