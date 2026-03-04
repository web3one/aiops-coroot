import { Base } from "./Base";

/**
 * 前端组件相关方法
 * 
 * 参考: https://kb.fzyun.net/projects/luban-support/wiki/
 */
export class BaseUI {
    /**
     * 按钮组
     */
    static groupButtons(title: string, buttons: any,) {
        // 转换成 aws_button_dropdown
        const items = Object.keys(buttons).map(key => {
            const result: Record<string, any> = {
                "id": key,
            };

            const button = buttons[key];
            for (const btnKey of Object.keys(button)) {
                const innerKey = (btnKey.startsWith("#")) ? btnKey.substring(1) : btnKey;
                result[innerKey] = button[btnKey];
            }
            return result;
        })
        return {
            "#type": "aws_button_dropdown",
            "#text": title,
            "#items": items,
        }
    }

    /** 普通按钮 */
    static button(params: {
        title: string,
        variant?: string,
        href?: string,
        disableWhen?: string,
        disabled?: boolean,
        classes?: string,
        newPage?: boolean,
        alt?: string,
        icon?: string,
        formAction?: string,
        click?: string,
        id?: string,
    }) {
        if (params.href) params.href = Base.getUrlWithProjectAdded(params.href);

        const content = params.alt ? this.textWithTitle(params.title, params.alt, false) : params.title;
        const result: Record<string, any> = {
            '#type': 'aws_button',
            '#text': content,
            "#variant": params.variant || "normal",
            "#href": params.href,
            "#target": params.newPage ? "_blank" : undefined,
            "#class_name": params.classes,
            "#icon_name": params.icon,
            "#form_action": params.formAction,
            "#on_click": params.click,
        }
        // 按钮置灰的效果
        result["#disabled"] = (params.disableWhen) ? this.markupItem(params.disableWhen) : params.disabled;
        // 不直接加#id属性,否则下拉操作组检查delete按钮时会因有空id而出错
        if (params.id) result["#id"] = params.id;
        return result;
    }

    /** 带点击事件的按钮。取消submit，只执行自定义的点击事件 */
    static clickButton(title: string, click: string, variant?: string, disable_definition?: string, icon?: string) {
        return this.button({
            title: title,
            variant: variant,
            disableWhen: disable_definition,
            icon: icon,
            formAction: "none",
            click: click,
        });
    }

    /** 表单中的提交按钮。可以添加提交前逻辑 */
    static submitButton(title: string, click?: string,) {
        return this.button({
            title: title,
            variant: "primary",
            click: click,
        });
    }

    /** 刷新按钮 */
    static refreshButton() {
        return this.button({
            title: "",
            icon: "refresh",
            formAction: "none",
            click: "window.location.href = window.location.href;",
            alt: "刷新",
        });
    }

    /** Table 中的普通提交按钮。若传入tableId，则自动添加逻辑有选中才可点 */
    static commonButton(title: string, tableId?: string,) {
        const disable_when = tableId ? `selected_${tableId}.length === 0` : undefined;
        return this.button({
            title: title,
            disableWhen: disable_when,
        });
    }

    /**
     * 表单中的删除按钮，对话框形式
     */
    static deleteButton(tableId: string,) {
        const disable_when = `selected_${tableId}.length === 0`;
        return this.clickButton("删除", `setValue_${tableId}_modal(true)`, "normal", disable_when);
    }

    /**
     * 有超链接的文本按钮，主色
     */
    static linkButton(title: string, url: string,) {
        const icon = title == "创建" ? "add-plus" : undefined;
        return this.button({ title: title, variant: "primary", href: url, icon: icon });
    }

    /**
     * 有超链接的文本按钮，无边框
     */
    static linkButtonLight(title: string, url: string) {
        return this.button({ title: title, variant: "link", href: url });
    }

    /**
     * 有超链接的文本按钮，有边框
     */
    static linkCommonButton(title: string, url: string, classes?: string, newPage?: boolean, alt?: string) {
        return this.button({ title: title, href: url, classes: classes, newPage: newPage, alt: alt });
    }

    static link(title: any, url: any, newPage?: boolean) {
        return {
            "#type": "aws_link",
            "#content": title,
            "#href": url,
            "#external": newPage || false,
        }
    }

    /** Table 中的 link。url 以 markup 包裹*/
    static tableLink(content: any, url: string, newPage?: boolean, classes?: string) {
        return {
            "#type": "aws_link",
            "#content": content,
            "#href": this.markupItem(url),
            "#external": newPage || false,
            "#class_name": classes,
        }
    }

    /** Table的一个列头 */
    static tableHeader(id: string, header: string, cell?: any, minWidth?: any, maxWidth?: any, width?: any) {
        minWidth = this.tableHeaderMinWidth(minWidth, header);
        return {
            "id": id,
            "header": header,
            "cell": cell,
            "minWidth": minWidth,
            "maxWidth": maxWidth,
            "width": width,
        };
    }
    /** Table的时间列头 */
    static tableHeaderTime(id: string, header: string) {
        return this.tableHeader(id, header, this.tableItemTime("item." + id));
    }
    /** Table的名称列头，带详情链接。比较固定的写法: item.name, item.id, /detail/{id} */
    static tableHeaderName() {
        return this.tableHeader("name", "名称", this.tableLink("{item.name}", "item.link"));
    }
    /** Table的描述列头 */
    static tableHeaderDescription() {
        return this.tableHeader("description", "描述");
    }
    /** Table的创建时间列头 */
    static tableHeaderCreated() {
        return this.tableHeaderTime("created", "创建时间");
    }
    /** Table的一个列头宽度，按字数确定最小宽度，避免折行 */
    private static tableHeaderMinWidth(minWidth: any, header: string) {
        if (minWidth) return minWidth;
        switch (header.length) {
            case 2:
                return "90px";
            case 3:
                return "100px";
            case 4:
                return "120px";
            case 5:
                return "140px";
            default:
                break;
        }
    }

    static statusIndicator(statusType: any, content: any, color?: any) {
        return {
            "#type": "aws_status_indicator",
            "#status_type": statusType,
            "#content": content,
            "#color_override": color,
        }
    }

    /** 包含头和内容的区域。有背景色，右上角可以有操作按钮 */
    static container(content: any, title?: any, buttons?: any, classes?: string, description?: string) {
        const header = title == undefined ? undefined : {
            "#type": "aws_header",
            "#title": title,
            "#actions": buttons,
            "#description": description,
        }
        return {
            "#type": "aws_container",
            "#header": header,
            "#class_name": classes,
            '#content': content,
        }
    }

    /** div包装 */
    static box(content: any, classes?: string) {
        return {
            "#type": "aws_box",
            "#content": content,
            "#class_name": classes,
        }
    }

    /** 包装，无样式 */
    static fragment(content: any) {
        return {
            "#type": "aws_fragment",
            "#content": content,
        }
    }

    /** 横向布局的一个表单字段 */
    static formFieldHorizontal(title: any, content: any, colspan = [3, 9]) {
        return {
            '#type': 'aws_form_field',
            '#label': title,
            '#control': this.grid(content, colspan),
        }
    }

    /** 网格布局。适合各部分比例不同的情况 */
    static grid(content: any[], colspan: any[] = [3, 9], classes?: string) {
        const gridDefinition = colspan.map(scale => ({ "colspan": scale }));
        return {
            "#type": "aws_grid",
            "#grid_definition": gridDefinition,
            "#content": content,
            "#class_name": classes,
        }
    }

    /** 大标题 */
    static pageTitle(title: string, variant?: string, description?: string, actionContent?: any,) {
        return {
            "#type": "aws_header",
            '#title': title,
            '#description': description,
            '#variant': variant || "h1",
            "#actions": this.horizontalPanel(actionContent, "xs"),
        }
    }

    /** 横排 */
    static horizontalPanel(content: any, size?: string) {
        return {
            "#type": "aws_space_between",
            "#direction": "horizontal",
            "#size": size ?? "m",
            "#content": content,
        }
    }
    /** 带actions结构的一个面板 */
    static panelWithActions(actionContent: any, title?: any) {
        return {
            '#type': 'aws_header',
            '#title': title,
            "#actions": this.horizontalPanel(actionContent, "xs"),
        };
    }

    /** 卡片 */
    static cardPanel(title: string, content: any, buttons?: any) {
        return this.container(content, title, buttons);
    }

    /** 详情的一个card，指定card的唯一标识、显示Title、编辑按钮的跳转Url、内容items、是否显示编辑按钮 */
    static cardPanelWithEdit(title: string, editUrl: string, items: any[], editable?: boolean, columns?: number) {
        editUrl = Base.getUrlWithProjectAdded(editUrl);
        const editButton = this.button({ title: "编辑", href: editUrl, icon: "" });
        return this.cardPanel(title, {
            "#type": "aws_key_value_pairs",
            "#columns": columns || 4,
            "#items": items,
        },
            editable ? { 'detail_button_edit': editButton } : undefined,
        );
    }

    /** 卡片内容（用于表单） */
    static cardContent(content: any, size?: any) {
        return {
            "#type": "aws_space_between",
            "#size": size ?? "m",
            "#content": content,
        }
    }

    /** 最简单的cardItem，label / value */
    static cardItem(title: string, content: any) {
        return {
            "label": title,
            "value": content,
        };
    }

    /** 带链接的cardItem */
    static cardItemLinkBlank(title: string, linkText: string, url: string, _attributes?: any) {
        return this.cardItemWithContent(title, this.link(linkText, url, true));
    }

    /** 时间cardItem，有时间格式处理 */
    static cardItemTime(title: string, content: any) {
        return this.cardItem(title, this.box({
            "#theme": "time_format",
            "time": content
        }));
    }

    /** 带富内容的cardItem */
    static cardItemWithContent(title: string, content: any) {
        return this.cardItem(title, this.box(content));
    }

    /** 表单的按钮，居右 */
    static formButtons(buttons: any) {
        return this.panelWithActions(buttons)
    }

    /** Table中的删除模态框。
     * tableId: table的id，如"project_list"。用于给modal/input/button等作为命名前缀。
     * 删除确认按钮：固定命名为 <tableId> + "_button_delete"，因为已有代码里大量使用了这种命名并做了引用。
     */
    static tableDeleteModal(tableId: string, title: string) {
        const pageTitle = `删除${title}`;
        const cardTitle = `确认删除所选的${title}吗？ 删除后数据无法恢复，请慎重！`;
        const modalName = `${tableId}_modal`;
        return {
            [modalName]: {
                "#type": "aws_modal",
                "#header": pageTitle,
                "#on_dismiss": `setValue_${modalName}_text('');setValue_${modalName}(false)`,
                "#content": {
                    "#type": "aws_space_between",
                    "#size": "m",
                    "#direction": "vertical",
                    "#content": {
                        "alert": {
                            "#type": "aws_alert",
                            "#header": cardTitle,
                            "#alert_type": "warning"
                        },
                        "selected": this.box(this.markupItem(`{selected_${tableId}.map((item) => (<li key={item.id}>{item.nameForDelete || item.name}</li>))}`), "aione-delete-area"),
                        "formfield": {
                            "#type": "aws_form_field",
                            "#label": "如果确认删除，请在文本输入框中输入“确认删除”。",
                            "#control": {
                                [modalName + "_text"]: {
                                    "#type": "aws_input",
                                    "#placeholder": "确认删除",
                                }
                            }
                        },
                        "footer": this.panelWithActions({
                            [tableId + "_button_cancel"]: this.clickButton("取消", `setValue_${modalName}_text('');setValue_${modalName}(false)`),
                            [tableId + "_button_delete"]: this.button({ title: "确定", variant: "primary", disableWhen: `value_${modalName}_text !== '确认删除'` }),
                        })
                    }
                }
            },
        }
    }
    /**
     * 表格带操作
     */
    static tableWithActions(tableId: string, title: any, actions: any, table: any, description?: any, noCheck = false): object {
        // 判断是否有删除操作。直接包含删除按钮，或操作组中包含删除按钮
        const withDeleteButton = actions && Object.keys(actions).find((btnId) => {
            if (btnId.endsWith("_delete")) return true;
            if (btnId.includes("_btngroup")) {
                return (actions[btnId]["#items"] ?? []).find((one: any) => one.id.endsWith("_delete"));
            }
            return false;
        });
        const result = {
            [tableId]: this.tableWithActionsContent(title, actions, table, description, tableId),
        };
        return (noCheck || !withDeleteButton) ? result : { ...this.tableDeleteModal(tableId, title), ...result };
    }

    /**
     * 表格带操作的内容部分
     */
    static tableWithActionsContent(title: any, actions: any, table: any, description?: any, tableId?: string): object {
        const tableData = {
            ...table,
            "#header": {
                "#description": description,
                ...this.panelWithActions(actions, title),
            }
        };
        if (tableId) {
            this.tableFiltersShowCount(tableData, tableId);
        }
        return tableData;
    }
    /** 显示过滤匹配的记录数 */
    private static tableFiltersShowCount(tableData: Record<string, any>, tableId: string) {
        const filters = tableData["#filter"]["#content"] || tableData["#filter"];
        if (filters) {
            // 仅一个搜索框
            const statement = `filter_status_${tableId} ? filter_total_${tableId} + ' 匹配项' : ''`;
            if (filters.default && Object.keys(filters).length === 1) {
                filters.default["#count_text"] = this.markupItem(statement);
            } else if (Object.keys(filters).length > 1) {
                filters["result"] = this.box(this.markupItem(`{${statement}}`), "mt-1");
            }
        }
    }

    /**
     * 表格，带选择列
     */
    static tableSelect(column_definitions: any[], rows: any[], multiple: number, order?: any, selectors?: any[], disorder_columns?: number[],): object {
        Base.itemsUrlWithProjectAdded(rows);

        column_definitions[0].isRowHeader = true;
        // sortingField: 无此属性则不排序；""/null/无效字段，则无法正常解析；
        column_definitions.forEach((one, index) => {
            if (!disorder_columns?.includes(index + 1)) {
                one.sortingField = one.sortingField || one.id;
            }
            one.cell = one.cell || `item.${one.id}`;
        });
        // 按原排序参数设置新的排序方式。order: [[3, "desc"]]
        // [this.commonSearch(3, apiGroups, "请选择组", "-- 所有 API 组 --")]
        // selectors: [{ "target_column": columnIndex, "search_options": options, "placeholder": placeholder, "blank_option": blankText || "无", }]
        const sortingField = (order?.length) ? column_definitions[order[0][0] - 1].id : undefined;
        const sortingDesc = (order?.length) ? (order[0][1] == "desc") : undefined;

        let selection_type = "multi"; // 复选框 or 单选框
        if (multiple == -1)
            selection_type = "";
        else if (!multiple)
            selection_type = "single";

        return {
            '#type': 'aws_table',
            '#column_definitions': column_definitions, // 列头定义
            '#items': rows, // 每行数据
            '#track_by': 'id',
            '#selection_type': selection_type,
            "#selected": [],
            "#wrap_lines": true, // 可折行
            "#sticky_columns": { "first": 1 },
            "#pagination": { "#type": "aws_pagination" }, // 分页
            "#filter": this.tableFilters(selectors), // 搜索区域

            "#sorting_column": { "sortingField": sortingField }, // 按原排序参数设置新的排序方式。order: [[3, "desc"]]
            "#sorting_descending": sortingDesc,
        }
    }
    /** Table的搜索区域 */
    private static tableFilters(selectors?: any[]) {
        const defaultFilter = {
            "default": {
                "#type": "aws_text_filter",
                "#filtering_placeholder": "按关键词搜索",
            },
        };

        if (selectors && selectors.length > 0) {
            const selectFilters = this.tableFilterSelects(selectors);
            const filters = this.addSetting(defaultFilter, selectFilters)
            return {
                "#type": "aws_space_between",
                "#direction": "horizontal",
                "#size": "xs",
                "#content": filters,
            }
        } else {
            return defaultFilter;
        }
    }

    /** 
     * Table的选择搜索条件转换，从旧模式转换为aws_table支持的模式
        [this.commonSearch(3, apiGroups, "请选择组", "-- 所有 API 组 --")]
        selectors: [{ 
             "target_column": columnIndex, 
             "search_options": {"0": {"label": "xxx", "value": "xxxx"}, }, 
             "placeholder": placeholder, 
             "blank_option": blankText || "无", 
        }]
     */
    private static tableFilterSelects(selectors?: any[]) {
        const result: Record<string, any> = {};
        (selectors || []).forEach(selector => {
            result["select_" + selector.target_column] = this.selectAws([
                this.cardItem(selector.blank_option, "-all-"),
                ...Object.values(selector.search_options),
            ], undefined, selector.placeholder, false);
        });
        return result;
    }

    /** 动态翻页取数据的Table */
    static tableAjax(header: any, url: string, needCheckBox: boolean, multiple: number, order?: any, disorder_columns?: number[], selectors?: any[],): object {
        const table = this.tableSelect(header, [], !needCheckBox ? -1 : multiple, order, selectors, disorder_columns)
        return this.addSetting(table, {
            "#ajax_url": url,
        });
    }

    /** 表格形式的表单 */
    static tableForm(header: any[], rows: Record<string, any>, colspan = [3, 9]): object {
        return {
            "#type": "aws_container",
            "#header": this.grid(header.map(oneHeader => this.box(oneHeader)), colspan),
            "#content": {
                "#type": "aws_column_layout",
                "#borders": "horizontal",
                "#columns": 1,
                "#content": Object.keys(rows).map(key => this.grid([...rows[key]], colspan)),
            }
        };
    }
    /** Table中的时间列 */
    static tableItemTime(timeField: string) {
        return `my_time_format(${timeField})`;
    }

    /** Table中的灰色字体 */
    static tableItemLightText(value: string) {
        return this.box(BaseUI.markupItem(value), "text-status-inactive");
    }

    /** 提交取值：得到 ajax table的选中行id */
    static selectedOfTableAjax(body: any, name: string) {
        const valueStr = body[name] || "[]";
        const values = JSON.parse(valueStr);
        return values.map((v: any) => v.id);
    }

    static badge(value: string, color: any, classes?: any) {
        return {
            "#type": "aws_badge",
            "#color": color,
            "#content": value,
            "#class_name": classes,
        }
    }

    /** 给一个组件添加属性 */
    static addSetting(ele: any, setting: any) {
        return Object.assign(ele, setting);
    }

    /** Add More 组件 */
    static attributeEditor(id: string, fields: any[], default_values: any[], gridLayout?: any[]) {
        /** Add More 的一行中的一个组件。是常规的formField类型，在方法内去掉formField包裹 */
        const field_definitions = fields.map(formField => {
            const awsField = formField["#control"];
            const fieldId = Object.keys(awsField)[0];
            const field = awsField[fieldId];
            const constraint_text = (formField["#constraint_text"] || "").replace(/"/g, '\\"');

            if (field["#on_change"] === undefined) {
                const expr = [];
                if (field["#aria_required"]) expr.push("!!detail.value");
                if (formField["#pattern"]) expr.push(`/${formField["#pattern"]}/.test(detail.value)`);

                field["#on_change"] = expr.length
                    ? `setValue_${id}(value_${id}.map((item, i) => i === index ? { ...item, ${fieldId}: detail.value, error:{ ...item.error, ${fieldId}: ${expr.join(" && ")} ? null : "请与所要求的格式保持一致。" } } : item));`
                    : undefined;
            }
            return {
                'label': formField["#label"],
                'key': fieldId,
                'control': field,
                'constraintText': `(item, index) => (index === value_${id}.length - 1) ? "${constraint_text}" : ""`,
                "errorText": { "#markup": `(item, index) => item.error? item.error.${fieldId} : ''` },
            }
        });
        return {
            [id]: {
                "#type": "aws_attribute_editor",
                "#default_value": default_values,
                "#definition": field_definitions,
                "#add_button_text": "添加",
                "#grid_layout": gridLayout,
            }
        };
    }

    /** Form字段的包裹块，用于定义 中文名称/描述 */
    static formField(params: {
        id: string,
        title?: string,
        field: any,
        constraint_text?: any,
        attributes?: any,
        required?: boolean,
        showRequired?: boolean,
    }) {
        if (params.required == undefined) params.required = true;
        if (params.showRequired == undefined) params.showRequired = true;

        const className = params.attributes?.["class"];
        if (className) params.field['#class_name'] = className;

        // 表单字段上方的文字，若非必填，加 “- 可选” 后缀，斜体显示
        const label = (!params.title || params.required || !params.showRequired) ? params.title : this.horizontalPanel({
            "title1": this.box(params.title),
            "title2": this.box(`- 可选`, "fst-italic"),
        }, "xxs");

        return {
            '#type': 'aws_form_field',
            '#label': label,
            '#control': { [params.id]: params.field },
            '#constraint_text': params.constraint_text,
            "#required": params.required,
            "#pattern": params.attributes?.pattern,
            "#pattern_err": "请与所要求的格式保持一致。",
        }
    }

    /**
     * 表单中的文本输入框
     */
    static textField(params: {
        id: string,
        title?: string,
        placeholder?: string,
        constraint_text?: any,
        value?: string,
        attributes?: any,
        required?: boolean,
        showRequired?: boolean,
        readonly?: boolean,
    }) {
        if (params.required == undefined) params.required = true;
        return this.formField({
            ...params,
            field: {
                '#type': 'aws_input',
                '#default_value': params.value || '',
                '#placeholder': params.placeholder || "请输入" + (params.title || ""),
                "#read_only": params.readonly,
                '#aria_required': params.required
            },
        });
    }


    /** 原鲁班组件的 hidden 输入框 */
    static hiddenField(value?: string) {
        return {
            "#type": "hidden",
            "#value": value,
        }
    }
    /** 亚马逊组件的 hidden 输入框 */
    static hiddenInput(id: string, value = '') {
        return BaseUI.textField({
            id: id,
            value: value,
            attributes: { "class": "d-none" },
            required: false
        });
    }
    /** 亚马逊组件的 hidden 多行文本框 */
    static hiddenTextArea(id: string, value = '') {
        return BaseUI.textArea(id, '', '', null, value, { "class": "d-none" }, false);
    }

    /** 多行文本框 */
    static textArea(id: string, title: string, placeholder: string, constraint_text: any, value = '', attributes = {},
        required = true, maxLength?: number, rows: number = 5) {
        placeholder = placeholder || "请输入" + title;
        return this.formField({
            id: id,
            title: title,
            field: {
                '#type': 'aws_text_area',
                '#default_value': value || '',
                '#placeholder': placeholder,
                '#aria_required': required,
                '#maxlength': maxLength,
                '#rows': rows,
            },
            constraint_text: constraint_text,
            attributes: attributes,
            required: required,
        });
    }

    /** 密码输入框 */
    static passwordField(id: string, title: string, placeholder: string, constraint_text: string, value = '', attributes = {}, required = true) {
        return this.formField({
            id: id,
            title: title,
            field: {
                '#type': 'aws_input',
                '#input_type': 'password',
                '#placeholder': placeholder,
                '#default_value': value || '',
                '#attached': { "library": ["ui_common/password"] },
                "#class_name": "view-password",
                "#auto_complete": "new-password",
                '#aria_required': required,
            },
            constraint_text: constraint_text,
            attributes: attributes,
            required: required,
            showRequired: false
        });
    }

    /** 选择框 */
    static selectItem(id: string, title: string, value: any, constraint_text: string, options: any,
        placeholder: string = "请选择", required = true) {
        // 传入的是 {key: value} ，转换成 [{value: key, label: value}] 
        options = options || {};
        const newoptions = Object.keys(options).map(key => this.cardItem(options[key], key)) || [];

        const defaultValue = value !== undefined ? newoptions.find(one => one.value === value) : undefined;
        return this.formField({
            id: id,
            title: title,
            field: BaseUI.selectAws(newoptions, defaultValue, placeholder, required),
            constraint_text: constraint_text,
            required: required
        });
    }

    /** 选择框。没有被formField包裹 */
    static selectAws(options: any[], defaultValue: any, placeholder: string, required: boolean): any {
        return {
            "#type": 'aws_select',
            "#select_options": options,
            "#default_value": defaultValue,
            "#placeholder": placeholder,
            "#disabled": false,
            "#aria_required": required,
            "#filtering_type": options.length > 10 ? "auto" : "",
        };
    }

    /** Radio框 */
    static radioField(id: string, title: string, value: string | number, constraint_text: string, options: any, required = true) {
        return this.formField({
            id: id,
            title: title,
            field: {
                "#type": 'aws_radio_group',
                "#items": options,
                "#default_value": value,
                "#aria_required": required,
            },
            constraint_text: constraint_text,
            required: required
        });
    }
    /** 复选框 */
    static checkboxField(id: string, title: any, constraint_text: string, value: boolean = false, readonly: boolean = false) {
        const required = false;
        return this.formField({
            id: id,
            title: "",
            field: {
                "#type": 'aws_toggle',
                "#content": title,
                "#default_value": value,
                "#aria_required": required,
                "#read_only": readonly,
                "#disabled": false,
            },
            constraint_text: constraint_text,
            required: required
        });
    }
    /** Radio横向选择框 */
    static radioTileField(id: string, title: string, value: string | number, constraint_text: string, options: any[],) {
        return this.formField({
            id: id,
            title: title,
            field: {
                "#type": 'aws_tiles',
                "#items": options,
                "#default_value": value,
            },
            constraint_text: constraint_text,
        });
    }

    /** 表单中的数值输入框 */
    static numberField(id: string, title: string, constraint_text: string, value: any, attributes: any = {}, required = true) {
        return this.formField({
            id: id,
            title: title,
            field: {
                '#type': 'aws_input',
                '#input_type': 'number',
                '#input_mode': 'decimal',
                '#default_value': value || '',
                '#aria_required': required,
            },
            constraint_text: constraint_text,
            attributes: attributes,
            required: required,
        });
    }

    static markupItem(markupContent: any) {
        return {
            "#markup": markupContent,
        }
    }

    static textWithTitle(content: any, title: any, needMarkup = true) {
        return {
            "#type": "aws_html_tooltip",
            "#title": needMarkup ? this.markupItem(title) : title,
            "#text": content,
        }
    }
    /**  带复制按钮的文字 */
    static textWithCopy(text: string, variant = "inline") {
        return {
            "#type": "aws_copy_to_clipboard",
            "#text_to_copy": text,
            "#variant": variant,
        }
    }

    static linkWithCopy(url: string, newPage?: boolean) {
        return this.fragment([
            this.textWithCopy(url, "icon"),
            this.link(url, url, newPage),
        ]);
    }

    /** Tab组。若指定id，则额外按id包一层，用于需要该id做js操作的场景 */
    static tabs(children: object, defaultTab?: string, id?: string, attributes = {}) {
        const tabs = {
            "#type": "aws_tabs",
            "#default_value": defaultTab,
            "#tabs": children,
            ...(attributes || {}),
        };
        return id ? { [id]: tabs } : tabs;
    }
    /** 一个Tab项 */
    static tabItem(id: string, header: string, content: any) {
        return {
            "id": id,
            "label": header,
            "content": content
        };
    }

    static textContent(text: string, classes: string) {
        return {
            "#type": "aws_text_content",
            "#content": this.markupItem(`<div class='${classes}'>${text}</div>`),
        }
    }

    static readonly validatePattern = {
        name: {
            pattern: "^.{1,128}$",
            message: "1-128 个字符。"
        },
        description: {
            pattern: "^[\\\\s\\\\S]{0,255}$",
            message: "最多 255 个字符。"
        },
        cn100: {
            pattern: "^.{1,100}$",
            message: "1-100 个字符。"
        },
        cn200: {
            pattern: "^.{1,200}$",
            message: "1-200 个字符。"
        },
        git: {
            pattern: "^https?:\\/\\/.{1,192}$",
            message: "输入以 http:// 或 https:// 开头且有效的 Git 地址。"
        },
        password: {
            pattern: "^.{0,100}$",
            message: "1-100 个字符。",
        },
        idPattern: {
            // pattern: "[a-z][\\-a-z0-9]{0,19}",
            pattern: "^[a-z](?:[a-z0-9]|(?<!-)-(?!-)){1,61}[a-z0-9]$",
            message: "3-63个字符，以小写字母开头，可包含小写字母、数字、连字符。不能包含两个连续的连字符，不能以连字符结尾。"
        },
    }
}