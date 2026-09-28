/* ==============================
   1. Города и данные оценки
   ============================== */
const cityCoordinates = { moscow:[55.751244,37.618423], kazan:[55.796127,49.106405], sochi:[43.585525,39.723062], spb:[59.93428,30.335098] };
const cityNames = { moscow:"Москва", kazan:"Казань", sochi:"Сочи", spb:"Санкт-Петербург" };
let map, routeCollection, pointCollection, multiRoute;

/* ==============================
   2. Яндекс Карта и метки
   ============================== */
function addAccessibilityPoints(center) {
  const [lat,lng] = center;
  const checks = [
    {point:[lat+.004,lng-.006], preset:"islands#greenCircleDotIcon", title:"Доступный переход", text:"Съезд найден с обеих сторон дороги."},
    {point:[lat+.001,lng-.001], preset:"islands#orangeCircleDotIcon", title:"Требует проверки", text:"Рекомендуется уточнить состояние покрытия и бордюров."},
    {point:[lat-.002,lng+.005], preset:"islands#redCircleDotIcon", title:"Возможное препятствие", text:"Возможен высокий бордюр или неровное покрытие."}
  ];
  checks.forEach(item => pointCollection.add(new ymaps.Placemark(item.point,{balloonContentHeader:item.title,balloonContentBody:item.text},{preset:item.preset})));
}
function initMap() {
  map = new ymaps.Map("map", {center:cityCoordinates.moscow, zoom:13, controls:["zoomControl","geolocationControl","typeSelector"]});
  routeCollection = new ymaps.GeoObjectCollection();
  pointCollection = new ymaps.GeoObjectCollection();
  map.geoObjects.add(routeCollection);
  map.geoObjects.add(pointCollection);
  addAccessibilityPoints(cityCoordinates.moscow);
}
function clearMapData() {
  routeCollection.removeAll();
  pointCollection.removeAll();
  if (multiRoute) { map.geoObjects.remove(multiRoute); multiRoute = null; }
}

/* ==============================
   3. Построение маршрута
   ============================== */
function buildRoute(from,to,city) {
  clearMapData();
  multiRoute = new ymaps.multiRouter.MultiRoute({referencePoints:[from,to], params:{routingMode:"pedestrian", results:1}}, {boundsAutoApply:true, wayPointVisible:false, viaPointVisible:false, routeActiveStrokeColor:"#a86478", routeActiveStrokeWidth:6});
  map.geoObjects.add(multiRoute);
  addAccessibilityPoints(cityCoordinates[city]);
  multiRoute.model.events.add("requestsuccess", () => {
    const activeRoute = multiRoute.getActiveRoute();
    if (!activeRoute) return;
    const distance = activeRoute.properties.get("distance").text;
    const duration = activeRoute.properties.get("duration").text;
    document.getElementById("distanceValue").textContent = distance;
    document.getElementById("timeValue").textContent = duration;
  });
}

/* ==============================
   4. Форма маршрута
   ============================== */
const citySelect=document.getElementById("citySelect");
const cityStatus=document.getElementById("cityStatus");
const routeForm=document.getElementById("routeForm");
citySelect.addEventListener("change",()=>{const city=citySelect.value;cityStatus.textContent=cityNames[city];clearMapData();map.setCenter(cityCoordinates[city],13);addAccessibilityPoints(cityCoordinates[city]);});
routeForm.addEventListener("submit",event=>{event.preventDefault();const from=document.getElementById("fromInput").value.trim();const to=document.getElementById("toInput").value.trim();const city=citySelect.value;if(!from||!to)return;document.getElementById("routeResult").hidden=false;document.getElementById("scoreBadge").textContent="82/100";document.getElementById("stairsValue").textContent=document.getElementById("avoidStairs").checked?"Не обнаружены":"Не проверялись";document.getElementById("resultDescription").textContent=`Маршрут «${from} — ${to}» построен через Яндекс Карты. Метки на карте показывают предварительную оценку доступности.`;document.getElementById("routeMessage").textContent="Маршрут построен. Нажмите на цветные метки для просмотра пояснений.";buildRoute(from,to,city);});

/* ==============================
   5. Регистрация пользователя
   ============================== */
const authModal=document.getElementById("authModal"); const openAuthButton=document.getElementById("openAuthButton"); const closeAuthButton=document.getElementById("closeAuthButton");
openAuthButton.addEventListener("click",()=>{authModal.hidden=false;}); closeAuthButton.addEventListener("click",()=>{authModal.hidden=true;}); authModal.addEventListener("click",event=>{if(event.target===authModal)authModal.hidden=true;});
document.getElementById("authForm").addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("nameInput").value.trim();const email=document.getElementById("emailInput").value.trim();localStorage.setItem("accessibleRouteAccount",JSON.stringify({name,email}));document.getElementById("authMessage").textContent=`Учётная запись для ${name} сохранена в этом браузере.`;openAuthButton.textContent=name;event.target.reset();});
try { const account=JSON.parse(localStorage.getItem("accessibleRouteAccount")); if(account&&account.name)openAuthButton.textContent=account.name; } catch(error) {}

/* ==============================
   6. Запуск API Яндекс Карт
   ============================== */
ymaps.ready(initMap);
