# Сохранение настроек Lampa

Простая и удобная система резервного копирования и синхронизации настроек (`localStorage`) для медиацентра **Lampa**. Проект состоит из клиентского плагина для Lampa и легковесного Python-сервера, который принимает и сохраняет бэкапы.

## Возможности

* **Определение устройства**: Каждое устройство получает уникальное имя (например, `tv_room`), под которым хранятся его настройки.
* **Управление**: Есть меню для сохранения, восстановления настроек или смены имени устройства.
* **Резервные копии на сервере**: Настройки сохраняются в виде индивидуальных текстовых файлов (`settings_<имя_устройства>.txt`).
* **Настройки по умолчанию**: Если бэкап для текущего устройства не найден, плагин предложит создать его или загрузить базовый файл по умолчанию (`template.txt`).

---

## Установка и настройка

### 1. Настройка бэкап-сервера (скрипт на Python)

1. Поместите скрипт сервера [bckp_server.py](https://raw.githubusercontent.com/crazym00n/customplugins/refs/heads/main/%D0%91%D1%8D%D0%BA%D0%B0%D0%BF%20%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BA%20Lampa/bckp_server.py) в нужную директорию на вашем сервере (например, в `/opt/`).
2. Отредактируйте конфигурацию в начале файла `bckp_server.py` под ваши нужды:
```python
CONFIG = {
    "server_ip": "0.0.0.0",
    "server_port": 9999,
    "backup_folder": "/opt/lampac/wwwroot/backup"  # Путь к папке с бэкапами
}

```


3. Создайте systemd-сервис для автозапуска
```bash
cat > /etc/systemd/system/lampa-backup.service <<'EOF'
[Unit]
Description=Lampa Backup Settings
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/
ExecStart=/usr/bin/python3 /opt/bckp_server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

4. Запустите сервер
```bash
systemctl daemon-reload
systemctl enable --now lampa-backup.service
```



### 2. Установка плагина в Lampa

1. Разместите файл [backup.js](https://raw.githubusercontent.com/crazym00n/customplugins/refs/heads/main/%D0%91%D1%8D%D0%BA%D0%B0%D0%BF%20%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BA%20Lampa/backup.js) на вашем веб-сервере (например, в каталоге плагинов Lampac: `/opt/lampac/wwwroot/custom_plugins/backup.js`).
2. В самом начале файла `backup.js` укажите IP-адрес, порт вашего бэкап-сервера и путь к папке бэкапов:
```javascript
var CONFIG = {
    server_ip: '192.168.0.1', // IP вашего сервера
    server_port: '9999',         // Порт сервера
    backup_folder: '/backup'     // Путь к папке на сервере
};

```


3. Подключите плагин в интерфейсе Lampa (через настройки в [init.conf](https://github.com/crazym00n/customplugins/blob/main/%D0%91%D1%8D%D0%BA%D0%B0%D0%BF%20%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BA%20Lampa/init.conf)).

---

## Использование

После установки плагина в меню настроек Lampa появится новый пункт **«Резервное копирование»**. При нажатии на него откроется меню с тремя опциями:

* **Имя устройства** — позволяет посмотреть или изменить текущее имя устройства (используется в названии файла бэкапа, при указании того же имени - позволяет переносить настройки между устройствами).
* **Сохранить настройки** — выгружает текущий `localStorage` вашего клиента Lampa на сервер.
* **Восстановить настройки** — проверяет наличие бэкапа для текущего устройства на сервере и применяет его (с последующей перезагрузкой приложения).
* **Опционально** — можно создать своего рода "шаблон настроек", если предварительно настроить одно устройство так, как вам надо, потом создать резервную копию и переименовать ее файл в [template.txt]({"tmdb_rating":"{\"98\":{\"vote_average\":8.2,\"timestamp\":1785249847480},\"278\":{\"vote_average\":8.7,\"timestamp\":1785249847480},\"497\":{\"vote_average\":8.5,\"timestamp\":1785249847480},\"60625\":{\"vote_average\":8.7,\"timestamp\":1785249847479},\"94997\":{\"vote_average\":8.4,\"timestamp\":1785249847478},\"125988\":{\"vote_average\":8.2,\"timestamp\":1785249847479},\"137113\":{\"vote_average\":7.6,\"timestamp\":1785249847480},\"324434\":{\"vote_average\":7.6,\"timestamp\":1785249847479},\"533535\":{\"vote_average\":7.6,\"timestamp\":1785249847480},\"687163\":{\"vote_average\":8.7,\"timestamp\":1785249847480},\"774531\":{\"vote_average\":7.9,\"timestamp\":1785249847480},\"911430\":{\"vote_average\":7.8,\"timestamp\":1785249847480},\"950396\":{\"vote_average\":7.7,\"timestamp\":1785249847480},\"980489\":{\"vote_average\":7.7,\"timestamp\":1785249847480},\"1083381\":{\"vote_average\":7.1,\"timestamp\":1785249847479},\"1184918\":{\"vote_average\":8.3,\"timestamp\":1785249847480},\"1242898\":{\"vote_average\":7.8,\"timestamp\":1785249847480},\"1275779\":{\"vote_average\":7.3,\"timestamp\":1785249847478},\"1317149\":{\"vote_average\":8.2,\"timestamp\":1785249847480},\"1339713\":{\"vote_average\":8.2,\"timestamp\":1785249847479},\"1368337\":{\"vote_average\":8,\"timestamp\":1785249847478},\"1449787\":{\"vote_average\":5.9,\"timestamp\":1785249847479},\"1495287\":{\"vote_average\":4.5,\"timestamp\":1785249847479},\"1503327\":{\"vote_average\":0,\"timestamp\":1785249847479,\"_empty\":true},\"1507718\":{\"vote_average\":5.3,\"timestamp\":1785249847480},\"1567584\":{\"vote_average\":0,\"timestamp\":1785249847479,\"_empty\":true},\"1706764\":{\"vote_average\":7,\"timestamp\":1785249847480}}","lampac_unic_id":"j8qpza8e","parser_torrent_type":"jackett","metric_adview":"0","plugins":"[{\"url\":\"http://lampa.nas/online.js\",\"status\":1,\"name\":\"Онлайн\",\"author\":\"lampac\"},{\"url\":\"http://lampa.nas/catalog.js\",\"status\":1,\"name\":\"Альтернативные источники каталога\",\"author\":\"lampac\"},{\"url\":\"http://lampa.nas/sisi.js\",\"status\":1,\"name\":\"Клубничка\",\"author\":\"lampac\"},{\"url\":\"http://lampa.nas/startpage.js\",\"status\":1,\"name\":\"Стартовая страница\",\"author\":\"lampac\"},{\"url\":\"http://lampa.nas/timecode.js\",\"status\":1,\"name\":\"Синхронизация тайм-кодов\",\"author\":\"lampac\"},{\"url\":\"http://lampa.nas/bookmark.js\",\"status\":1,\"name\":\"Синхронизация закладок\",\"author\":\"lampac\"},{\"url\":\"http://lampa.nas/custom_plugins/backup.js\",\"status\":1,\"name\":\"Бэкап\",\"author\":\"Я и трактор\"},{\"url\":\"http://lampa.nas/gst.js\",\"status\":1,\"name\":\"Transcoding\",\"author\":\"http://192.168.42.9:9118/gst.js\"}]","player_torrent":"inner","source":"cub","timetable":"[]","lampac_initiale":"true","native":"true","metric_date":"2026-07-28","jackett_key":"1","parser_use":"true","jackett_url":"lampa.nas","proxy_tmdb":"false","sisi_unic_id":"iw1wbidy","menu_sort":"[\"Главная\",\"Лента\",\"Фильмы\",\"Мультфильмы\",\"Сериалы\",\"Персоны\",\"Каталог\",\"Фильтр\",\"Релизы\",\"Аниме\",\"Избранное\",\"История\",\"Подписки\",\"Расписание\",\"Торренты\",\"Клубничка\",\"Jellyfin\",\"Спорт\",\"Shots\"]","custom_device_backup_name":"kkk","content_rows_shots_main":"false","tmdb_lang":"ru","lampa_uid":"GVXDPK7D","video_quality_default":"2160","full_btn_priority":"1020426233","platform":"browser","buttons_plugin_version":"1.81","plugins_blacklist":"[\"lampa.line.pm\",\"xabb.ru/h.js\",\"ebu.land\",\"abu.land\",\"lampa32.github.io/torrserver.js\",\"abmsx.tech/torrserver.js\",\"cxlampa.github.io/cub_off.js\",\"lampatv.fun\",\"xiaomishka.github.io/lampa/ads.js\",\"xiaomishka.github.io\",\"uspeh.sbs/app.js\",\"andreyurl54.github.io\",\"torrs.su\",\"uspeh.sbs/ss.js\",\"uspeh.sbs\",\"usph.xyz/aa.js\",\"lampa.land/plugins/r.js\",\"tvigl.info/plugins/shots.js\",\"94.103.90.167\",\"jacred.xyz\"]","activity":"{\"title\":\"Главная - CUB\",\"component\":\"main\",\"source\":\"cub\",\"page\":1,\"select\":\"open\"}","language":"ru","account_user":"","poster_size":"w300"}). Тогда на новом устройстве при первом вызове восстановления можно будет восстановить настройки из этого шаблона.

## Скриншоты

<p><img src="img\Screenshot_1.jpg">
<p><img src="img\Screenshot_2.jpg">
<p><img src="img\Screenshot_3.jpg">
<p><img src="img\Screenshot_4.jpg">
