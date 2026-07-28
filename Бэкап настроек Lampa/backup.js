(function () {
    'use strict';

    var CONFIG = {
        server_ip: '192.168.42.9',
        server_port: '9999',
        backup_folder: '/backup'
    };

    function getDeviceName() {
        var name = localStorage.getItem('custom_device_backup_name');
        if (!name) {
            name = '';
        }
        return name;
    }

    function changeDeviceName() {
        Lampa.Input.edit({
            title: Lampa.Lang.translate('lampac_backup_name'),
            value: getDeviceName(),
            free: true,
            nosave: true
        }, function (new_value) {
            if (typeof new_value === 'string') {
                var sanitized = new_value.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
                if (sanitized !== '') {
                    localStorage.setItem('custom_device_backup_name', sanitized);
                    Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_name_changed') + ': ' + sanitized);
                    $('.backup-device-name-descr').text(sanitized);
                } else {
                    Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_empty_name'));
                }
            }
        });
    }

    function saveEverything() {
        var name = getDeviceName();
        if (!name) {
            Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_set_name_first'));
            changeDeviceName();
            return;
        }

        var fullData = JSON.stringify(localStorage);
        var url = 'http://' + CONFIG.server_ip + ':' + CONFIG.server_port + '/?device=' + name;

        fetch(url, {
            method: 'POST',
            body: fullData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_success_save') + ': ' + name);
            } else {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_error_save'));
            }
        })
        .catch(function() {
            Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_error_connection'));
        });
    }

    function applyBackupText(text, isDefault) {
        try {
            var parsed = JSON.parse(text);
            for (var key in parsed) {
                localStorage.setItem(key, parsed[key]);
            }

            if (isDefault) {
                localStorage.removeItem('custom_device_backup_name');
            }

            Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_restored'));
            setTimeout(function() { window.location.reload(); }, 2000);
        } catch (e) {
            Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_error_read'));
        }
    }

    function fetchAndApply(url, fallbackUrl) {
        fetch(url)
        .then(function(res) {
            if (!res.ok) throw new Error('Not found');
            return res.text();
        })
        .then(function(text) {
            applyBackupText(text, false);
        })
        .catch(function() {
            if (fallbackUrl) {
                showNotFoundModal(fallbackUrl);
            } else {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_not_found'));
            }
        });
    }

    function showNotFoundModal(defaultUrl) {
        var name = getDeviceName() || Lampa.Lang.translate('lampac_backup_not_set');
        var html = $(
            '<div style="position: relative;">' +
                '<div class="backup-close-btn selector" style="position: absolute; right: -10px; top: -55px; font-size: 28px; cursor: pointer; color: #aaa; z-index: 99; padding: 10px;">&times;</div>' +
                '<div style="margin-bottom: 15px; color: #aaa; font-size: 14px;">' + Lampa.Lang.translate('lampac_backup_modal_text_1') + ' "<b>' + name + '</b>" ' + Lampa.Lang.translate('lampac_backup_modal_text_2') + '</div>' +
                '<div class="settings-param selector" style="margin-bottom: 10px; cursor:pointer;">' +
                    '<div class="settings-param__name">' + Lampa.Lang.translate('lampac_backup_modal_create') + '</div>' +
                    '<div class="settings-param__descr">' + Lampa.Lang.translate('lampac_backup_modal_create_descr') + '</div>' +
                '</div>' +
                '<div class="settings-param selector" style="cursor:pointer;">' +
                    '<div class="settings-param__name">' + Lampa.Lang.translate('lampac_backup_modal_default') + '</div>' +
                    '<div class="settings-param__descr">' + Lampa.Lang.translate('lampac_backup_modal_default_descr') + '</div>' +
                '</div>' +
            '</div>'
        );

        function closeModal() {
            Lampa.Modal.close();
        }

        html.find('.backup-close-btn').on('hover:enter click', function () {
            closeModal();
        });

        html.find('.settings-param').eq(0).on('hover:enter click', function () {
            closeModal();
            saveEverything();
        });

        html.find('.settings-param').eq(1).on('hover:enter click', function () {
            closeModal();
            loadDefaultSettings();
        });

        Lampa.Modal.open({
            title: Lampa.Lang.translate('lampac_backup_modal_title'),
            html: html,
            size: 'medium',
            onBack: function () {
                closeModal();
            }
        });
    }

    function loadEverything() {
        var name = getDeviceName();
        if (!name) {
            Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_set_name_first'));
            changeDeviceName();
            return;
        }

        var folder = CONFIG.backup_folder.replace(/\/+$/, '');
        var backupUrl = folder + '/settings_' + name + '.txt';
        var defaultUrl = folder + '/default_settings.txt';
        fetchAndApply(backupUrl, defaultUrl);
    }

    function loadDefaultSettings() {
        var folder = CONFIG.backup_folder.replace(/\/+$/, '');
        var defaultUrl = folder + '/default_settings.txt';

        fetch(defaultUrl)
        .then(function(res) {
            if (!res.ok) throw new Error('Not found');
            return res.text();
        })
        .then(function(text) {
            applyBackupText(text, true);
        })
        .catch(function() {
            Lampa.Noty.show(Lampa.Lang.translate('lampac_backup_noty_default_not_found'));
        });
    }

    function startPlugin() {
        window.lampac_backup_plugin = true;

        Lampa.Lang.add({
            lampac_backup: {
                ru: 'Резервное копирование',
                en: 'Backup',
                uk: 'Резервне копіювання',
                be: 'Рэзервовае капіраванне',
                zh: '备份'
            },
            lampac_backup_export: {
                ru: 'Сохранить мои настройки',
                en: 'Save my settings',
                uk: 'Зберегти мої налаштування',
                be: 'Захаваць мае налады',
                zh: '保存我的设置'
            },
            lampac_backup_import: {
                ru: 'Восстановить мои настройки',
                en: 'Restore my settings',
                uk: 'Відновити мої налаштування',
                be: 'Аднавіць мае налады',
                zh: '恢复我的设置'
            },
            lampac_backup_default: {
                ru: 'Восстановить настройки из шаблона',
                en: 'Restore template settings',
                uk: 'Відновити налаштування із шаблону',
                be: 'Аднавіць наладкі з шаблону',
                zh: '从模板恢复设置'
            },
            lampac_backup_name: {
                ru: 'Имя устройства',
                en: 'Device name',
                uk: 'Назва пристрою',
                be: 'Назва прылады',
                zh: '设备名称'
            },
            lampac_backup_not_set: {
                ru: 'не задано',
                en: 'not set',
                uk: 'не задано',
                be: 'не зададзена',
                zh: '未设置'
            },
            lampac_backup_noty_name_changed: {
                ru: 'Имя изменено на',
                en: 'Name changed to',
                uk: 'Назву змінено на',
                be: 'Назву зменено на',
                zh: '名称更改为'
            },
            lampac_backup_noty_empty_name: {
                ru: 'Имя не может быть пустым',
                en: 'Name cannot be empty',
                uk: 'Назва не може бути порожньою',
                be: 'Назва не можа быць пустой',
                zh: '名称不能为空'
            },
            lampac_backup_noty_set_name_first: {
                ru: 'Сначала укажите имя устройства!',
                en: 'Set device name first!',
                uk: 'Спочатку вкажіть назву пристрою!',
                be: 'Спачатку пакажыце назву прылады!',
                zh: '请先设置设备名称！'
            },
            lampac_backup_noty_success_save: {
                ru: 'Успех! Бэкап сохранен для',
                en: 'Success! Backup saved for',
                uk: 'Успіх! Бекап збережено для',
                be: 'Поспех! Рэзервовая копія захавана для',
                zh: '成功！已为以下设备保存备份'
            },
            lampac_backup_noty_error_save: {
                ru: 'Ошибка сохранения',
                en: 'Save error',
                uk: 'Помилка збереження',
                be: 'Памылка захавання',
                zh: '保存错误'
            },
            lampac_backup_noty_error_connection: {
                ru: 'Ошибка соединения с бэкап-сервером',
                en: 'Backup server connection error',
                uk: 'Помилка з’єднання з бекап-сервером',
                be: 'Памылка злучэння з рэзервовым серверам',
                zh: '备份服务器连接错误'
            },
            lampac_backup_noty_restored: {
                ru: 'Восстановлено! Перезагрузка...',
                en: 'Restored! Rebooting...',
                uk: 'Відновлено! Перезавантаження...',
                be: 'Аднаўлена! Перазагрузка...',
                zh: '已恢复！正在重启...'
            },
            lampac_backup_noty_error_read: {
                ru: 'Ошибка чтения файла бэкапа',
                en: 'Backup file read error',
                uk: 'Помилка читання файлу бекапу',
                be: 'Памылка чытання файла рэзервовай копіі',
                zh: '读取备份文件错误'
            },
            lampac_backup_noty_not_found: {
                ru: 'Файл бэкапа не найден на сервере',
                en: 'Backup file not found on server',
                uk: 'Файл бекапу не знайдено на сервері',
                be: 'Файл рэзервовай копіі не знойдзены на серверы',
                zh: '服务器上未找到备份文件'
            },
            lampac_backup_noty_default_not_found: {
                ru: 'Файл default_settings.txt не найден',
                en: 'default_settings.txt not found',
                uk: 'Файл default_settings.txt не знайдено',
                be: 'Файл default_settings.txt не знойдзены',
                zh: '未找到 default_settings.txt'
            },
            lampac_backup_modal_title: {
                ru: 'Бэкап не найден',
                en: 'Backup not found',
                uk: 'Бекап не знайдено',
                be: 'Рэзервовая копія не знойдзена',
                zh: '未找到备份'
            },
            lampac_backup_modal_text_1: {
                ru: 'Для устройства с именем',
                en: 'For device named',
                uk: 'Для пристрою з назвою',
                be: 'Для прылады з назвай',
                zh: '对于名为'
            },
            lampac_backup_modal_text_2: {
                ru: 'бэкап не найден. Что сделать?',
                en: 'backup not found. What to do?',
                uk: 'бекап не знайдено. Що зробити?',
                be: 'рэзервовая копія не знойдзена. Што зрабіць?',
                zh: '的设备，未找到备份。要做什么？'
            },
            lampac_backup_modal_create: {
                ru: 'Создать бэкап',
                en: 'Create backup',
                uk: 'Створити бекап',
                be: 'Стварыць рэзервовую копію',
                zh: '创建备份'
            },
            lampac_backup_modal_create_descr: {
                ru: 'Сохранить текущие настройки под этим именем',
                en: 'Save current settings under this name',
                uk: 'Зберегти поточні налаштування під цією назвою',
                be: 'Захаваць бягучыя налады пад гэтай назвай',
                zh: '以此名称保存当前设置'
            },
            lampac_backup_modal_default: {
                ru: 'Восстановить default_settings.txt',
                en: 'Restore default_settings.txt',
                uk: 'Відновити default_settings.txt',
                be: 'Аднавіць default_settings.txt',
                zh: '恢复 default_settings.txt'
            },
            lampac_backup_modal_default_descr: {
                ru: 'Загрузить базовые настройки по умолчанию',
                en: 'Load basic default settings',
                uk: 'Завантажити базові налаштування за замовчуванням',
                be: 'Загрузіць базавыя налады па змаўчанні',
                zh: '加载基本的默认设置'
            }
        });

        Lampa.SettingsApi.addComponent({
            component: 'backup',
            icon: '<svg width="88" height="83" viewBox="0 0 88 83" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M81.7671 30.4752V23.5114C81.7611 21.7339 81.1797 20.0062 80.11 18.5867C79.0402 17.1672 77.5396 16.1322 75.8326 15.6367V8.67441C75.8302 6.48914 74.961 4.39407 73.4158 2.84885C71.8705 1.30363 69.7755 0.43445 67.5902 0.432007H20.1098C17.9245 0.43445 15.8295 1.30363 14.2842 2.84885C12.739 4.39407 11.8698 6.48914 11.8674 8.67441V15.6367C10.1604 16.1322 8.65977 17.1672 7.59002 18.5867C6.52026 20.0062 5.9389 21.7339 5.93293 23.5114V30.4752C4.22699 30.9708 2.72724 32.0051 1.65785 33.4237C0.588461 34.8422 0.00686778 36.5688 0 38.3452V73.9536C0.00244347 76.1389 0.871622 78.2339 2.41684 79.7792C3.96207 81.3244 6.05713 82.1936 8.24241 82.196H79.4591C81.6444 82.1936 83.7395 81.3244 85.2847 79.7792C86.8299 78.2339 87.6991 76.1389 87.7015 73.9536V38.3468C87.6949 36.5698 87.1132 34.8428 86.0435 33.4239C84.9738 32.005 83.4736 30.9706 81.7671 30.4752ZM20.1113 5.04788H67.5917C68.5532 5.0491 69.4749 5.43157 70.1547 6.11141C70.8346 6.79126 71.217 7.71297 71.2183 8.67441V15.2674H16.4848V8.67441C16.486 7.71297 16.8685 6.79126 17.5483 6.11141C18.2282 5.43157 19.1499 5.0491 20.1113 5.04788ZM14.1769 19.8833H73.5247C74.4864 19.8845 75.4083 20.2672 76.0882 20.9474C76.7681 21.6275 77.1504 22.5497 77.1512 23.5114V30.1044H64.8314C63.474 30.1029 62.1373 30.4374 60.9405 31.0779C59.7437 31.7185 58.724 32.6452 57.9723 33.7755L55.5612 37.3913C55.2306 37.8885 54.782 38.2962 54.2556 38.5781C53.7291 38.86 53.1411 39.0073 52.544 39.0068H35.1575C34.5604 39.0073 33.9724 38.86 33.446 38.5781C32.9195 38.2962 32.471 37.8885 32.1403 37.3913L29.7293 33.7755C28.9776 32.6452 27.9579 31.7185 26.7611 31.0779C25.5643 30.4374 24.2275 30.1029 22.8701 30.1044H10.5503V23.5129C10.5512 22.5512 10.9334 21.6291 11.6133 20.9489C12.2932 20.2687 13.2152 19.886 14.1769 19.8848V19.8833ZM83.0857 73.9551C83.0844 74.9166 82.702 75.8383 82.0221 76.5181C81.3423 77.198 80.4206 77.5804 79.4591 77.5817H8.24241C7.28096 77.5804 6.35925 77.198 5.67941 76.5181C4.99956 75.8383 4.61709 74.9166 4.61587 73.9551V38.3468C4.61709 37.3853 4.99956 36.4636 5.67941 35.7838C6.35925 35.1039 7.28096 34.7215 8.24241 34.7202H22.8701C23.4675 34.7194 24.0559 34.8665 24.5826 35.1484C25.1094 35.4303 25.5582 35.8382 25.8889 36.3358L28.2999 39.9516C29.0515 41.0816 30.0709 42.0082 31.2674 42.6488C32.464 43.2893 33.8004 43.6239 35.1575 43.6227H52.544C53.9012 43.6239 55.2376 43.2893 56.4341 42.6488C57.6306 42.0082 58.6501 41.0816 59.4016 39.9516L61.8127 36.3358C62.1434 35.8382 62.5921 35.4303 63.1189 35.1484C63.6456 34.8665 64.234 34.7194 64.8314 34.7202H79.4591C80.4206 34.7215 81.3423 35.1039 82.0221 35.7838C82.702 36.4636 83.0844 37.3853 83.0857 38.3468V73.9551Z" fill="white"/><path d="M54.2365 58.295H33.465C32.8529 58.295 32.2659 58.5382 31.8331 58.971C31.4003 59.4038 31.1571 59.9909 31.1571 60.603C31.1571 62.2151 31.4003 61.8021 31.8331 62.2349C32.2659 62.6678 32.8529 62.9109 33.465 62.9109H54.2365C54.8486 62.9109 55.4356 62.6678 55.8684 62.2349C56.3012 61.8021 56.5444 61.2151 56.5444 60.603C56.5444 59.9909 56.3012 59.4038 55.8684 58.971C55.4356 58.382 54.8486 58.295 54.2365 58.295Z" fill="white"/></svg>',
            name: Lampa.Lang.translate('lampac_backup')
        });

        // 1. Имя устройства
        Lampa.SettingsApi.addParam({
            component: 'backup',
            param: {
                type: 'button'
            },
            field: {
                name: Lampa.Lang.translate('lampac_backup_name'),
                description: '<span class="backup-device-name-descr">' + getDeviceName() + '</span>'
            },
            onChange: function() {
                changeDeviceName();
            }
        });

        // 2. Сохранить мои настройки
        Lampa.SettingsApi.addParam({
            component: 'backup',
            param: {
                type: 'button'
            },
            field: {
                name: Lampa.Lang.translate('lampac_backup_export')
            },
            onChange: function() {
                saveEverything();
            }
        });

        // 3. Восстановить мои настройки
        Lampa.SettingsApi.addParam({
            component: 'backup',
            param: {
                type: 'button'
            },
            field: {
                name: Lampa.Lang.translate('lampac_backup_import')
            },
            onChange: function() {
                loadEverything();
            }
        });

        // 4. Восстановить настройки по умолчанию
        Lampa.SettingsApi.addParam({
            component: 'backup',
            param: {
                type: 'button'
            },
            field: {
                name: Lampa.Lang.translate('lampac_backup_default')
            },
            onChange: function() {
                loadDefaultSettings();
            }
        });
    }

    if (!window.lampac_backup_plugin) startPlugin();

})();