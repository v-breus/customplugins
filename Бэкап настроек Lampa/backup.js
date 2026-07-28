(function () {
    'use strict';

    // ================= CONFIGURATION =================
    var CONFIG = {
        server_ip: '192.168.0.1',
        server_port: '9999',
        backup_folder: '/backup' // Путь к папке на сервере
    };
    // =================================================

    // Получаем или запрашиваем имя устройства
    function getDeviceName() {
        var name = localStorage.getItem('custom_device_backup_name');
        if (!name) {
            name = 'tv_room';
            localStorage.setItem('custom_device_backup_name', name);
        }
        return name;
    }

    // Функция ручного ввода имени устройства через стандартный диалог
    function changeDeviceName(callback) {
        Lampa.Select.close();
        
        var currentName = getDeviceName();
        var userInput = window.prompt('Введите имя устройства:', currentName);
        
        if (userInput !== null) {
            var sanitized = userInput.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
            if (sanitized !== '') {
                localStorage.setItem('custom_device_backup_name', sanitized);
                Lampa.Noty.show('Имя изменено на: ' + sanitized);
                if (callback) callback(sanitized);
            } else {
                Lampa.Noty.show('Имя не может быть пустым');
                if (callback) callback(currentName);
            }
        } else {
            if (callback) callback(currentName);
        }
    }

    // Сохранение настроек текущего устройства
    function saveEverything() {
        var name = getDeviceName();
        var fullData = JSON.stringify(localStorage);
        Lampa.Noty.show('Сохранение настроек для "' + name + '"...');

        var url = 'http://' + CONFIG.server_ip + ':' + CONFIG.server_port + '/?device=' + name;

        fetch(url, {
            method: 'POST',
            body: fullData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                Lampa.Noty.show('Успех! Бэкап сохранен для: ' + name);
            } else {
                Lampa.Noty.show('Ошибка сохранения');
            }
        })
        .catch(function() {
            Lampa.Noty.show('Ошибка соединения с бэкап-сервером');
        });
    }

    // Применение загруженного текста настроек
    function applyBackupText(text) {
        try {
            var parsed = JSON.parse(text);
            for (var key in parsed) {
                localStorage.setItem(key, parsed[key]);
            }
            Lampa.Noty.show('Восстановлено! Перезагрузка...');
            setTimeout(function() { window.location.reload(); }, 2000);
        } catch (e) {
            Lampa.Noty.show('Ошибка чтения файла бэкапа');
        }
    }

    // Загрузка файла бэкапа
    function fetchAndApply(url, fallbackUrl) {
        fetch(url)
        .then(function(res) {
            if (!res.ok) throw new Error('Not found');
            return res.text();
        })
        .then(function(text) {
            applyBackupText(text);
        })
        .catch(function() {
            if (fallbackUrl) {
                showNotFoundModal(fallbackUrl);
            } else {
                Lampa.Noty.show('Файл бэкапа не найден на сервере');
            }
        });
    }

    // Модальное окно, если бэкапа с таким именем нет
    function showNotFoundModal(defaultUrl) {
        var name = getDeviceName();
        var html = $(
            '<div style="position: relative;">' +
                '<div class="backup-close-btn selector" style="position: absolute; right: -10px; top: -55px; font-size: 28px; cursor: pointer; color: #aaa; z-index: 99; padding: 10px;">&times;</div>' +
                '<div style="margin-bottom: 15px; color: #aaa; font-size: 14px;">Для устройства с именем "<b>' + name + '</b>" бэкап не найден. Что сделать?</div>' +
                '<div class="settings-param selector" style="margin-bottom: 10px; cursor:pointer;">' +
                    '<div class="settings-param__name">Создать бэкап</div>' +
                    '<div class="settings-param__descr">Сохранить текущие настройки под этим именем</div>' +
                '</div>' +
                '<div class="settings-param selector" style="cursor:pointer;">' +
                    '<div class="settings-param__name">Восстановить default_settings.txt</div>' +
                    '<div class="settings-param__descr">Загрузить базовые настройки по умолчанию</div>' +
                '</div>' +
            '</div>'
        );

        function closeModal() {
            Lampa.Modal.close();
            Lampa.Controller.toggle('menu');
        }

        html.find('.backup-close-btn').on('hover:enter click', function () {
            closeModal();
        });

        html.find('.settings-param').eq(0).on('hover:enter click', function () {
            Lampa.Modal.close();
            saveEverything();
        });

        html.find('.settings-param').eq(1).on('hover:enter click', function () {
            Lampa.Modal.close();
            Lampa.Noty.show('Загрузка default_settings.txt...');
            fetch(defaultUrl)
            .then(function(res) { return res.text(); })
            .then(function(text) {
                applyBackupText(text);
            })
            .catch(function() {
                Lampa.Noty.show('Файл default_settings.txt тоже не найден');
            });
        });

        Lampa.Modal.open({
            title: 'Бэкап не найден',
            html: html,
            size: 'medium',
            onBack: function () {
                closeModal();
            }
        });

        setTimeout(function() {
            $('.modal').off('click.close_modal').on('click.close_modal', function(e) {
                if ($(e.target).hasClass('modal')) {
                    closeModal();
                }
            });
        }, 50);
    }

    function loadEverything() {
        var name = getDeviceName();
        Lampa.Noty.show('Проверка бэкапа для "' + name + '"...');
        
        var folder = CONFIG.backup_folder.replace(/\/+$/, '');
        var backupUrl = folder + '/settings_' + name + '.txt';
        var defaultUrl = folder + '/default_settings.txt';

        fetchAndApply(backupUrl, defaultUrl);
    }

    // Функция отрисовки элементов управления в боковом меню
    function openBackupSidebar() {
        var name = getDeviceName();
        
        Lampa.Select.show({
            title: 'Резервное копирование',
            items: [
                {
                    title: 'Имя устройства',
                    subtitle: name,
                    action: 'change_name'
                },
                {
                    title: 'Сохранить настройки',
                    subtitle: 'Записать настройки на сервер под этим именем',
                    action: 'save'
                },
                {
                    title: 'Восстановить настройки',
                    subtitle: 'Загрузить настройки с сервера по этому имени',
                    action: 'load'
                }
            ],
            onSelect: function (item) {
                if (item.action === 'change_name') {
                    changeDeviceName(function () {
                        openBackupSidebar();
                    });
                } else if (item.action === 'save') {
                    saveEverything();
                } else if (item.action === 'load') {
                    loadEverything();
                }
            },
            onBack: function () {
                Lampa.Controller.toggle('menu');
            }
        });
    }

    function initMenuButtons() {
        $('.menu__list').each(function() {
            var menuList = $(this);
            if (menuList.find('.backup-menu-btn').length > 0) return;

            var btnBackup = $(
                '<div class="menu__item selector backup-menu-btn" style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 5px;">' +
                    '<div class="menu__ico">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>' +
                    '</div>' +
                    '<div class="menu__text">Резервное копирование</div>' +
                '</div>'
            );

            btnBackup.on('hover:enter click', function () {
                openBackupSidebar();
            });

            menuList.append(btnBackup);
        });

        var allBtns = $('.backup-menu-btn');
        if (allBtns.length > 1) {
            allBtns.slice(1).remove();
        }
    }

    Lampa.Listener.follow('menu', function (e) {
        if (e.type === 'render') {
            initMenuButtons();
        }
    });

    if (window.appready) {
        initMenuButtons();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                initMenuButtons();
            }
        });
    }
})();
