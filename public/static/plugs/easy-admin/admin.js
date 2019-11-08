define(["jquery"], function ($) {

    var form = layui.form,
        layer = layui.layer,
        laytpl = layui.laytpl,
        table = layui.table,
        laydate = layui.laydate;

    var init = {
        table_elem: 'currentTable',
        table_render_id: 'currentTableRenderId',
    };

    var admin = {
        config: {
            shade: [0.02, '#000'],
        },
        url: function (url) {
            return '/' + ADMIN + '/' + url;
        },
        parame: function (param, defaultParam) {
            return param != undefined ? param : defaultParam;
        },
        request: {
            post: function (option, ok, no, ex) {
                return admin.request.ajax('post', option, ok, no, ex);
            },
            get: function (option, ok, no, ex) {
                return admin.request.ajax('get', option, ok, no, ex);
            },
            ajax: function (type, option, ok, no, ex) {
                type = type || 'get';
                option.url = option.url || '';
                option.data = option.data || {};
                option.prefix = option.prefix || false;
                option.statusName = option.statusName || 'code';
                option.statusCode = option.statusCode || 1;
                ok = ok || function (res) {
                };
                no = no || function (res) {
                    var msg = res.msg == undefined ? '返回数据格式有误' : res.msg;
                    admin.msg.error(msg);
                    return false;
                };
                ex = ex || function (res) {
                };
                if (option.url == '') {
                    admin.msg.error('请求地址不能为空');
                    return false;
                }
                if (option.prefix == true) {
                    option.url = admin.url(option.url);
                }
                var index = admin.msg.loading('加载中');
                $.ajax({
                    url: option.url,
                    type: type,
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    dataType: "json",
                    data: option.data,
                    timeout: 60000,
                    success: function (res) {
                        admin.msg.close(index);
                        if (eval('res.' + option.statusName) == option.statusCode) {
                            return ok(res);
                        } else {
                            return no(res);
                        }
                    },
                    error: function (xhr, textstatus, thrown) {
                        admin.msg.error('Status:' + xhr.status + '，' + xhr.statusText + '，请稍后再试！', function () {
                            ex(this);
                        });
                        return false;
                    }
                });
            }
        },
        msg: {
            // 成功消息
            success: function (msg, callback) {
                if (callback == undefined) {
                    callback = function () {
                    }
                }
                var index = layer.msg(msg, {icon: 1, shade: admin.config.shade, scrollbar: false, time: 2000, shadeClose: true}, callback);
                return index;
            },
            // 失败消息
            error: function (msg, callback) {
                if (callback == undefined) {
                    callback = function () {
                    }
                }
                var index = layer.msg(msg, {icon: 2, shade: admin.config.shade, scrollbar: false, time: 3000, shadeClose: true}, callback);
                return index;
            },
            // 警告消息框
            alert: function (msg, callback) {
                var index = layer.alert(msg, {end: callback, scrollbar: false});
                return index;
            },
            // 对话框
            confirm: function (msg, ok, no) {
                var index = layer.confirm(msg, {title: '操作确认', btn: ['确认', '取消']}, function () {
                    typeof ok === 'function' && ok.call(this);
                }, function () {
                    typeof no === 'function' && no.call(this);
                    self.close(index);
                });
                return index;
            },
            // 消息提示
            tips: function (msg, time, callback) {
                var index = layer.msg(msg, {time: (time || 3) * 1000, shade: this.shade, end: callback, shadeClose: true});
                return index;
            },
            // 加载中提示
            loading: function (msg, callback) {
                var index = msg ? layer.msg(msg, {icon: 16, scrollbar: false, shade: this.shade, time: 0, end: callback}) : layer.load(2, {time: 0, scrollbar: false, shade: this.shade, end: callback});
                return index;
            },
            // 关闭消息框
            close: function (index) {
                return layer.close(index);
            }
        },
        table: {
            render: function (options) {
                options.elem = options.elem || '#' + init.table_elem;
                options.id = options.id || init.table_render_id;
                options.url = options.url || window.location.href;
                options.toolbar = options.toolbar || '#toolbar';
                options.page = admin.parame(options.page, true);
                options.search = admin.parame(options.search, true);
                options.limit = options.limit || 15;
                options.limits = options.limits || [10, 15, 20, 25, 50, 100];
                options.defaultToolbar = options.defaultToolbar || ['filter', {
                    title: '查询',
                    layEvent: 'TABLE_SEARCH',
                    icon: 'layui-icon-search'
                }];
                if (options.search == true) {
                    admin.table.renderSearch(options.cols);
                }
                return table.render(options);
            },
            renderSearch: function (cols) {
                // TODO 只初始化第一个table搜索字段，如果存在多个(绝少数需求)，得自己去扩展
                cols = cols[0] || {};
                var newCols = [];
                var formHtml = '';
                $.each(cols, function (i, d) {
                    d.field = d.field || false;
                    d.fieldAlias = admin.parame(d.fieldAlias, d.field);
                    d.title = d.title || d.field || '';
                    d.selectList = d.selectList || {};
                    d.search = admin.parame(d.search, true);
                    d.searchTip = d.searchTip || '请输入' + d.title || '';
                    d.searchValue = d.searchValue || '';
                    d.searchOp = d.searchOp || '%*%';
                    d.timeType = d.timeType || 'date';
                    if (d.field != false && d.search != false) {
                        switch (d.search) {
                            case true:
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<input name="' + d.fieldAlias + '" data-search-op="' + d.searchOp + '" value="' + d.searchValue + '" placeholder="' + d.searchTip + '" class="layui-input">\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                            case  'select':
                                d.searchOp = '=';
                                var selectHtml = '';
                                $.each(d.selectList, function (sI, sV) {
                                    var selected = '';
                                    if (sI == d.searchValue) {
                                        selected = 'selected=""';
                                    }
                                    selectHtml += '<option value="' + sI + '" ' + selected + '>' + sV + '</option>/n';
                                });
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<select class="layui-select" name="' + d.fieldAlias + '"  data-search-op="' + d.searchOp + '" >\n' +
                                    '<option value="">- 全部 -</option> \n' +
                                    selectHtml +
                                    '</select>\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                            case 'range':
                                d.searchOp = 'range';
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<input name="' + d.fieldAlias + '"  data-search-op="' + d.searchOp + '"  value="' + d.searchValue + '" placeholder="' + d.searchTip + '" class="layui-input">\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                            case 'time':
                                d.searchOp = '=';
                                formHtml += '\t<div class="layui-form-item layui-inline">\n' +
                                    '<label class="layui-form-label">' + d.title + '</label>\n' +
                                    '<div class="layui-input-inline">\n' +
                                    '<input name="' + d.fieldAlias + '"  data-search-op="' + d.searchOp + '"  value="' + d.searchValue + '" placeholder="' + d.searchTip + '" class="layui-input">\n' +
                                    '</div>\n' +
                                    '</div>';
                                break;
                        }
                        newCols.push(d);
                    }
                });
                if (formHtml != '') {
                    $('#currentTable').before('<fieldset class="table-search-fieldset">\n' +
                        '<legend>条件搜索</legend>\n' +
                        '<form class="layui-form layui-form-pane">\n' +
                        formHtml +
                        '<div class="layui-form-item layui-inline">\n' +
                        '<button class="layui-btn layui-btn-primary"><i class="layui-icon">&#xe615;</i> 搜 索</button>\n' +
                        ' </div>' +
                        '</form>' +
                        '</fieldset>');

                    // 初始化form表单
                    form.render();
                    $.each(newCols, function (ncI, ncV) {
                        if (ncV.search == 'range') {
                            laydate.render({range: true, type: ncV.timeType, elem: '[name="' + ncV.field + '"]'});
                        }
                        if (ncV.search == 'time') {
                            laydate.render({type: ncV.timeType, elem: '[name="' + ncV.field + '"]'});
                        }
                    });
                }
            },
            tool: function (data, option) {
                option.operat = option.operat || [];
                var html = '';
                $.each(option.operat, function (i, v) {
                    // 初始化数据
                    v.class = v.class || '';
                    v.text = v.text || '';
                    v.event = v.event || '';
                    v.icon = v.icon || '';
                    v.open = v.open || '';
                    v.request = v.request || '';
                    v.title = v.title || v.text || '';
                    v.extend = v.extend || '';
                    if (v.open != '') {
                        v.open = v.open.indexOf("?") != -1 ? v.open + '&id=' + data.id : v.open + '?id=' + data.id;
                    }
                    if (v.request != '') {
                        v.request = v.request.indexOf("?") != -1 ? v.request + '&id=' + data.id : v.request + '?id=' + data.id;
                    }
                    // 组合数据
                    v.icon = v.icon != '' ? '<i class="' + v.icon + '"></i>' : '';
                    v.class = v.class != '' ? 'class="' + v.class + '" ' : '';
                    v.open = v.open != '' ? 'data-open="' + v.open + '" data-title="' + v.title + '" ' : '';
                    v.request = v.request != '' ? 'data-request="' + v.request + '" data-title="' + v.title + '" ' : '';
                    v.event = v.event != '' ? 'lay-event="' + v.event + '" ' : '';
                    html += '<a ' + v.class + v.open + v.request + v.event + v.extend + '>' + v.icon + v.text + '</a>';
                });
                return html;
            },
            image: function (data, option) {
                option.imageWidth = option.imageWidth || 200;
                option.imageHeight = option.imageHeight || 40;
                option.title = option.title || option.field;
                var src = data[option.field],
                    title = data[option.title];
                return '<img style="max-width: ' + option.imageWidth + 'px; max-height: ' + option.imageHeight + 'px;" src="' + src + '" data-image="' + title + '"  src="' + title + '">';
            },
            switch: function (data, option) {
                option.filter = option.filter || option.field || null;
                option.checked = option.checked || 1;
                option.tips = option.tips || '开|关';
                var checked = data.status == option.checked ? 'checked' : '';
                return '<input type="checkbox" name="' + option.field + '" value="' + data.id + '" lay-skin="switch" lay-text="' + option.tips + '" lay-filter="' + option.filter + '" ' + checked + ' >';
            },
            listenSwitch: function (option, ok) {
                option.filter = option.filter || '';
                option.url = option.url || '';
                option.field = option.field || option.filter || '';
                option.tableName = option.tableName || 'currentTable';
                form.on('switch(' + option.filter + ')', function (obj) {
                    var checked = obj.elem.checked ? 1 : 0;
                    if (typeof ok === 'function') {
                        return ok({
                            id: obj.value,
                            checked: checked,
                        });
                    } else {
                        var data = {
                            id: obj.value,
                            field: option.field,
                            value: checked,
                        };
                        admin.request.post({
                            url: option.url,
                            prefix: true,
                            data: data,
                        }, function (res) {
                        }, function (res) {
                            admin.msg.error(res.msg, function () {
                                table.reload(option.tableName);
                            });
                        }, function () {
                            table.reload(option.tableName);
                        });
                    }
                });
            }
        },
        checkMobile: function () {
            var userAgentInfo = navigator.userAgent;
            var mobileAgents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
            var mobile_flag = false;
            //根据userAgent判断是否是手机
            for (var v = 0; v < mobileAgents.length; v++) {
                if (userAgentInfo.indexOf(mobileAgents[v]) > 0) {
                    mobile_flag = true;
                    break;
                }
            }
            var screen_width = window.screen.width;
            var screen_height = window.screen.height;
            //根据屏幕分辨率判断是否是手机
            if (screen_width < 600 && screen_height < 800) {
                mobile_flag = true;
            }
            return mobile_flag;
        },
        open: function (title, url, width, height, isResize) {
            if (isResize == undefined) isResize = true;
            var index = layui.layer.open({
                title: title,
                type: 2,
                area: [width, height],
                content: url,
                success: function (layero, index) {
                    var body = layui.layer.getChildFrame('body', index);
                }
            });
            if (admin.checkMobile() || width == undefined || height == undefined) {
                layer.full(index);
            } else {
                if (width.replace("px", "") > window.innerWidth || height.replace("px", "") > window.innerHeight) {
                    layer.full(index);
                }
            }
            if (isResize == true) {
                $(window).on("resize", function () {
                    layer.full(index);
                })
            }
        },
        listen: function (formCallback, ok, no, ex) {

            //监听工具条
            table.on('tool(test)', function (obj) { //注：tool 是工具条事件名，test 是 table 原始容器的属性 lay-filter="对应的值"
                var data = obj.data; //获得当前行数据
                var layEvent = obj.event; //获得 lay-event 对应的值（也可以是表头的 event 参数对应的值）
                var tr = obj.tr; //获得当前行 tr 的 DOM 对象（如果有的话）

                if (layEvent === 'detail') { //查看
                    //do somehing
                } else if (layEvent === 'del') { //删除
                    layer.confirm('真的删除行么', function (index) {
                        obj.del(); //删除对应行（tr）的DOM结构，并更新缓存
                        layer.close(index);
                        //向服务端发送删除指令
                    });
                } else if (layEvent === 'edit') { //编辑
                    //do something

                    //同步更新缓存对应的值
                    obj.update({
                        username: '123'
                        , title: 'xxx'
                    });
                } else if (layEvent === 'LAYTABLE_TIPS') {
                    layer.alert('Hi，头部工具栏扩展的右侧图标。');
                }
            });

            // 监听弹出层的打开
            $('body').on('click', '[data-open]', function () {
                admin.open(
                    $(this).attr('data-title'),
                    admin.url($(this).attr('data-open')),
                    $(this).attr('data-width'),
                    $(this).attr('data-height')
                );
            });

            // 放大图片
            $('body').on('click', '[data-image]', function () {
                var title = $(this).attr('data-image'),
                    src = $(this).attr('src'),
                    alt = $(this).attr('alt');
                var photos = {
                    "title": title,
                    "id": Math.random(),
                    "data": [
                        {
                            "alt": alt,
                            "pid": Math.random(),
                            "src": src,
                            "thumb": src
                        }
                    ]
                };
                layer.photos({
                    photos: photos,
                    anim: 5
                });
                return false;
            });


            // 监听动态表格刷新
            $('body').on('click', '[data-table-refresh]', function () {
                var tableId = $(this).attr('data-table-refresh');
                if (tableId == undefined || tableId == '' || tableId == null) {
                    tableId = init.table_render_id;
                }
                table.reload(tableId);
            });

            // 监听请求
            $('body').on('click', '[data-request]', function () {
                var title = $(this).attr('data-title'),
                    url = admin.url($(this).attr('data-request'));
                admin.request.get({
                    url: url,
                }, function (res) {
                    admin.msg.success(res.msg, function () {
                        table.reload(option.tableName);
                    });
                })

            });

            // 监听表单提交事件
            $('body').on('click', '[lay-submit]', function () {
                var filter = $(this).attr('lay-filter'),
                    url = $(this).attr('lay-submit');
                if (url == undefined || url == '' || url == null) {
                    url = window.location.href;
                } else {
                    url = admin.url(url);
                }
                if (filter == undefined || filter == '' || filter == null) {
                    admin.msg.error('请设置lay-filter提交事件');
                    return false;
                }
                form.on('submit(' + filter + ')', function (data) {
                    var dataField = data.field;
                    if (typeof formCallback === 'function') {
                        formCallback(url, dataField);
                    } else {
                        admin.api.form(url, dataField, ok, no, ex);
                    }
                    return false;
                });
            });
        },
        api: {
            form: function (url, data, ok, no, ex) {
                ok = ok || function (res) {
                    res.msg = res.msg || '';
                    admin.msg.success(res.msg, function () {
                        admin.api.closeCurrentOpen({
                            refreshTable: true
                        });
                    });
                    return false;
                };
                admin.request.post({
                    url: url,
                    data: data,
                }, ok, no, ex);
                return false;
            },
            closeCurrentOpen: function (option) {
                option = option || {};
                option.refreshTable = option.refreshTable || false;
                option.refreshFrame = option.refreshFrame || false;
                if (option.refreshTable == true) {
                    option.refreshTable = 'currentTable';
                }
                var index = parent.layer.getFrameIndex(window.name);
                parent.layer.close(index);
                if (option.refreshTable != false) {
                    console.log('刷新重载');
                    console.log(option.refreshTable);
                    parent.layui.table.reload(option.refreshTable);
                }
                if (option.refreshFrame) {
                    parent.location.reload();
                }
                return false;
            },
            refreshFrame: function () {
                location.reload();
                return false;
            },
            refreshTable: function (tableName) {
                tableName = tableName | 'currentTable';
                table.reload(tableName);
            }
        },
    };
    return admin;
});