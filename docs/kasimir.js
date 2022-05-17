/* KasimirJS EMBED - documentation: https://kasimirjs.infracamp.org - Author: Matthias Leuffen <m@tth.es>*/

/* from core/init.js */



if (typeof KaToolsV1 === "undefined") {
    window.KaToolsV1 = class {
    }

    /**
     * The last element started by Autostarter
     * @type {HTMLElement|HTMLScriptElement}
     */
    window.KaSelf = null;
}


/* from core/dom-ready.js */
/**
 * Wait for DomContentLoaded or resolve immediate
 *
 * <example>
 * await MicxToolsVx.domReady();
 * </example>
 *
 * @return {Promise<string>}
 */
KaToolsV1.domReady = async ()=> {
    return new Promise((resolve) => {
        if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive")
            return resolve("loaded");
        document.addEventListener("DOMContentLoaded", ()=>resolve('DOMContentLoaded'));
    });
}

/* from core/query-select.js */
/**
 * Query a Element or trigger an Exception
 *
 * @param query
 * @param parent
 * @param exception
 * @return {HTMLElement}
 */
KaToolsV1.querySelector = (query, parent, exception) => {
    if (typeof exception === "undefined")
        exception = `querySelector '${query}' not found`
    if (typeof parent === "undefined" || parent === null)
        parent = document;
    let e = parent.querySelectorAll(query);
    if (e.length === 0) {
        console.warn(exception, "on parent: ", parent);
        throw exception;
    }
    return e[0];
}

/* from core/debounce.js */

KaToolsV1._debounceInterval = {i: null, time: null};

/**
 * Debounce a event
 *
 *
 *
 * @param min   Minimum Time to wait
 * @param max   Trigger event automatically after this time
 * @return {Promise<unknown>}
 */
KaToolsV1.debounce = async (min, max=null) => {
    if (max === null)
        max = min;
    let dbi = KaToolsV1._debounceInterval;
    return new Promise((resolve) => {
        if (dbi.time < (+new Date()) - max && dbi.i !== null) {
            return resolve();
        }
        if (dbi.i !== null) {
            return;
        }
        dbi.time = (+new Date());
        dbi.i = window.setTimeout(() => {
            dbi.i = null;
            return resolve('done');

        }, min);
    });

}

/* from core/sleep.js */
KaToolsV1.sleep = (sleepms) => {
    return new Promise((resolve) => {
        window.setTimeout(() => {
            return resolve('done');
        }, sleepms);
    });
}

/* from core/eval.js */


KaToolsV1.eval = (stmt, __scope, e, __refs) => {
    if (stmt.endsWith(";"))
        stmt = stmt.slice(0, -1);

    const reserved = ["var", "null", "let", "const", "function", "class", "in", "of", "for", "true", "false", "await", "$this"];
    let r = "var $this = e;";
    for (let __name in __scope) {
        if (reserved.indexOf(__name) !== -1)
            continue;
        if (__name.indexOf("-") !== -1) {
            console.error(`Invalid scope key '${__name}': Cannot contain - in scope:`, __scope);
            throw `eval() failed: Invalid scope key: '${__name}': Cannot contain minus char '-'`;
        }
        r += `var ${__name} = __scope['${__name}'];`
    }
    // If the scope was cloned, the original will be in $scope. This is important when
    // Using events [on.click], e.g.
    if (typeof __scope.$scope === "undefined") {
        r += "var $scope = __scope;";
    }
    try {
        // console.log(r + '(' + stmt + ')');
        return eval(r  + '('+stmt+')')
    } catch (ex) {
        console.error("cannot eval() stmt: '" + stmt + "': " + ex + " on element ", e, "(context:", __scope, ")");
        throw "eval('" + stmt + "') failed: " + ex;
    }
}

/* from core/quick-template.js */

class KaToolsV1_QuickTemplate {

    constructor(selector) {
        if (typeof selector === "string")
            selector = KaToolsV1.querySelector(selector);
        this.template = selector;
        if ( ! this.template instanceof HTMLTemplateElement) {
            let error = "KaToolsV1_QuickTemplate: Parameter 1 is no <template> element. Selector: " + selector + "Element:" + this.template
            console.warn(error);
            throw error;
        }
        this._tplElem = document.createElement("template");
    }


    appendTo(selector, $scope) {
        if (typeof selector === "string")
            selector = KaToolsV1.querySelector(selector);

        let outerHtml = this.template.innerHTML;
        this._tplElem.innerHTML = outerHtml.replaceAll(/\[\[(.*?)\]\]/ig, (matches, stmt)=>{
            try {
                return KaToolsV1.eval(stmt, $scope)
            } catch (e) {
                console.error(`KaToolsV1_QuickTemplate: Error evaling stmt '${stmt}' on element `, this.template, "$scope:", $scope, "Error:", e);
                throw e;
            }
        });

        selector.append(document.importNode(this._tplElem.content, true));
    }

}

/* from core/apply.js */

KaToolsV1.apply = (selector, scope, recursive=false) => {
    if (typeof selector === "string")
        selector = KaToolsV1.querySelector(selector);

    let attMap = {
        "textcontent": "textContent",
        "htmlcontent": "htmlContent"
    }

    for(let attName of selector.getAttributeNames()) {
        //console.log(attName);
        if ( ! attName.startsWith("kap:")) {
            continue;
        }

        let attVal = selector.getAttribute(attName);

        let attType = attName.split(":")[1];
        let attSelector = attName.split(":")[2];
        if (typeof attSelector === "undefined")
            attSelector = null;


        if (attType === "on") {
            if (selector._ka_on === true)
                continue;
            let attScope = {$scope: scope, ...scope}
            if (attSelector !== null) {

                selector.addEventListener(attSelector, (e) => {
                    attScope["$event"] = e;
                    return KaToolsV1.eval(attVal, attScope, selector);
                });
            } else {
                let actionArr = KaToolsV1.eval(attVal, attScope, selector)
                for (let eventName in actionArr) {
                    selector.addEventListener(eventName, (e) => {
                        attScope["$event"] = e;
                        return actionArr[eventName](attScope, e);
                    });
                }
            }
            selector._ka_on = true;
            continue;
        }

        let r = KaToolsV1.eval(attVal, scope, selector);

        switch (attType) {
            case "ref":
                if (typeof scope.$ref === "undefined")
                    scope.$ref = {};
                scope.$ref[r] = selector;
                break;

            case "classlist":
                if (attSelector  !== null) {
                    if (r === true) {
                        selector.classList.add(attSelector)
                    } else {
                        selector.classList.remove(attSelector)
                    }
                    break;
                }
                for (let cname in r) {
                    if (r[cname] === true) {
                        selector.classList.add(cname);
                    } else {
                        selector.classList.remove(cname);
                    }
                }
                break;



            case "bindarray":
                if ( ! Array.isArray(r)) {
                    console.error("kap:bindarr: Not an array!", r, selector);
                    return;
                }
                if (r.indexOf(selector.value) === -1)
                    selector.checked = false;
                else
                    selector.checked = true;

                if (typeof selector._kap_bind === "undefined") {
                    selector.addEventListener("change", (event) => {

                        let arr = KaToolsV1.eval(attVal, scope, selector);

                        if (arr.indexOf(selector.value) === -1 && selector.checked)
                            arr.push(selector.value);
                        if (arr.indexOf(selector.value) !== -1 && ! selector.checked)
                            arr = arr.filter((e) => e !== selector.value);
                        scope = {$scope: scope, ...scope, __curVal: arr};
                        KaToolsV1.eval(`${attVal} = __curVal`, scope, selector);
                        if (scope.$on && scope.$on.change)
                            scope.$on.change(event);
                    })
                    selector._kap_bind = true;
                }
                break;

            case "bind":
                if (selector.type === "checkbox" || selector.type === "radio") {
                    if (r === true)
                        selector.checked = true;
                    else
                        selector.checked = false;
                } else {
                    selector.value = typeof r !== "undefined" ? r : "";
                }

                if (typeof selector._kap_bind === "undefined") {
                    selector.addEventListener("change", (event) => {

                        let value = null;
                        if (selector.type === "checkbox" || selector.type === "radio") {
                            value = selector.checked
                        } else {
                            value = selector.value
                        }
                        scope = {$scope: scope, ...scope, __curVal: value}
                        KaToolsV1.eval(`${attVal} = __curVal`, scope, selector);
                        if (scope.$on && scope.$on.change)
                            scope.$on.change(event);
                    })
                    selector.addEventListener("keyup", (event) => {
                        scope = {$scope: scope,...scope, __curVal: selector.value}
                        KaToolsV1.eval(`${attVal} = __curVal`, scope, selector);
                        if (scope.$on && scope.$on.change)
                            scope.$on.change(event);

                    })
                    selector._kap_bind = true;
                }
                break;

            case "options":
                console.log(selector, selector.value);
                let value = selector.value;
                selector.innerHTML = "";
                for (let option in r) {
                    if (isNaN(option)) {
                        selector.appendChild(new Option(r[option], option));
                    } else {
                        if (typeof r[option].text !== "undefined") {
                            selector.appendChild(new Option(r[option].text, r[option].value));
                        } else {
                            selector.appendChild(new Option(r[option], r[option]));
                        }
                    }
                }
                if (value !== null)
                    selector.value = value;
                break;

            case "attr":
                if (attSelector  !== null) {
                    if (r === null || r === false) {
                        selector.removeAttribute(attSelector)
                    } else {
                        selector.setAttribute(attSelector, r);
                    }
                    break;
                }
                for (let cname in r) {
                    if (r[cname] ===null || r[cname] === false) {
                        selector.removeAttribute(cname);
                    } else {
                        selector.setAttribute(cname, r[cname]);
                    }
                }
                break;

            default:
                if (typeof attMap[attType] !== "undefined")
                    attType = attMap[attType];
                if (typeof selector[attType] === "undefined") {
                    console.warn("apply(): trying to set undefined property ", attType, "on element", selector);
                }
                selector[attType] = r;
                break;
        }



    }
    if (recursive) {
        for (let e of selector.children) {
            KaToolsV1.apply(e, scope, recursive);
        }
    }
}

/* from core/elwalk.js */
/**
 *
 * @param {HTMLElement} elem
 * @param fn
 * @param recursive
 */
KaToolsV1.elwalk = (elem, fn, recursive=false, includeFirst=false) => {
    if (Array.isArray(elem))
        elem.children = elem;
    if (typeof elem.children === "undefined")
        return;
    if (includeFirst && elem instanceof HTMLElement) {
        let ret = fn(elem);
        if (ret === false)
            return false;
    }
    for(let child of elem.children) {
        let ret = fn(child);
        if (ret === false)
            continue; // No recursiion

        if (recursive && typeof child.children !== "undefined")
            KaToolsV1.elwalk(child, fn, recursive);

    }
}

/* from core/is-constructor.js */
/**
 * Returns true if fn in parameter 1 is a contructor
 *
 *
 * @param fn
 * @returns {boolean}
 */
KaToolsV1.is_constructor = (fn) => {
    return fn.toString().startsWith("class")
}

/* from tpl/templatify.js */

KaToolsV1._ka_el_idx = 0;
/**
 *
 * @param {HTMLElement|string} elem
 * @return {HTMLTemplateElement}
 */
KaToolsV1.templatify = (elem, returnMode=true) => {
    if (typeof elem === "string")
        elem = KaToolsV1.querySelector(elem);
    if ( ! (elem instanceof Node)) {
        console.error("[ka-templatify] Parameter 1 is not a html element: ", elem)
        throw `[ka-templify] Parameter 1 is not a html element: ${elem}`;
    }

    if (returnMode) {
        let returnTpl = document.createElement("template");
        returnTpl.setAttribute("_kaidx", (KaToolsV1._ka_el_idx++).toString())
        /* @var {HTMLTemplateElement} returnTpl */
        returnTpl.innerHTML = elem.innerHTML
            .replaceAll(/\[\[(.*?)\]\]/g, (matches, m1) => `<span kap:textContent="${m1}"></span>`);

        KaToolsV1.templatify(returnTpl.content, false);
        return returnTpl;
    }

    if (elem instanceof HTMLTemplateElement)
        elem = elem.content;

    let wrapElem = (el, attName, attVal) => {
        let tpl = document.createElement("template");
        tpl.setAttribute("_kaidx", (KaToolsV1._ka_el_idx++).toString())
        let clonedEl = el.cloneNode(true);
        clonedEl.removeAttribute(attName);
        tpl.content.append(clonedEl);
        tpl.setAttribute(attName, attVal);
        el.replaceWith(tpl);
        return tpl;
    }

    KaToolsV1.elwalk(elem, (el) => {
        //console.log(el);
        if ( ! el instanceof HTMLElement)
            return;
        let tpl = null;
        for (let attrName of el.getAttributeNames()) {
            if (attrName === "ka:for") {
                tpl = wrapElem(el, "ka:for", el.getAttribute("ka:for"));
                KaToolsV1.templatify(tpl, false);
                break;
            }
            if (attrName === "ka:if") {
                tpl = wrapElem(el, "ka:if", el.getAttribute("ka:if"));
                KaToolsV1.templatify(tpl, false);
                break;
            }
        }
    }, true, false);
}

/* from tpl/renderer.js */



class KaV1Renderer {

    constructor(template) {
        this.template = template;
        if (typeof this.template.__kachilds === "undefined")
            this.template.__kachilds = [];
        if (typeof this.template.__kasibling === "undefined")
            this.template.__kasibling = this.template.nextElementSibling;
    }

    _error(msg) {
        console.error(`[ka-template] ${msg} on element`, this.template);
        throw `[ka-template] ${msg} on element` + this.template;
    }

    _appendTemplate() {
        let elements = this.template.content;

        let elList = [];
        for (let curE of elements.children) {
            curE = curE.cloneNode(true);
            curE._ka_maintained_by = this.template.getAttribute("_kaidx");
            elList.push(curE);
            this.template.parentNode.insertBefore(curE, this.template.__kasibling);
        }
        this.template.__kachilds.push(elList);
    }

    _removeLastChild() {
        if (this.template.__kachilds.length === 0)
            return;
        let childs = this.template.__kachilds[this.template.__kachilds.length - 1];
        for (let curE of childs) {
            this.template.parentElement.removeChild(curE);
        }
        this.template.__kachilds.length = this.template.__kachilds.length - 1;

    }

    _renderFor($scope, stmt) {
        //console.log("kachilds", this.template.__kachilds);


        let matches = stmt.match(/^(let)\s+(?<target>.+)\s+(?<type>of|in)\s+(?<select>.+)$/);
        if (matches === null) {
            this._error(`Can't parse ka:for='${stmt}'`);
        }
        let selectVal = KaToolsV1.eval(matches.groups.select, $scope, this.template);
        let eIndex = 0;
        for (let index in selectVal) {
            let curScope = {$scope: $scope, ...$scope};
            curScope[matches.groups.target] = index;

            if (matches.groups.type === "of")
                curScope[matches.groups.target] = selectVal[index];

            if (this.template.__kachilds.length < eIndex + 1) {
                //console.log("append", eIndex, this.template.__kachilds.length);
                this._appendTemplate();
            }
            this._maintain(curScope, this.template.__kachilds[eIndex]);
            eIndex++;
        }
        for(let remIdx = eIndex; remIdx < this.template.__kachilds.length; ) {
            this._removeLastChild();
        }

    }

    _maintain($scope, childs) {
        for (let child of childs) {
            KaToolsV1.elwalk(child, (el) => {
                //console.log("walk", el);
                if (el instanceof HTMLTemplateElement) {
                    //console.log("maintain", el);
                    let r = new KaV1Renderer(el);
                    r.render($scope);
                    return false;
                }

                if (typeof el._ka_maintained_by !== "undefined" && el._ka_maintained_by !== this.template.getAttribute("_kaidx")) {
                    return false;
                }

                KaToolsV1.apply(el, $scope);

            }, true, true);
        }
    }


    _renderIf($scope, stmt) {
         let selectVal = KaToolsV1.eval(stmt, $scope, this.template);
        if (selectVal === true) {
            if (this.template.__kachilds.length === 0)
                this._appendTemplate();

            this._maintain($scope, this.template.__kachilds[0]);
        } else {
            this._removeLastChild();
        }
    }


    render($scope) {
        if (this.template.hasAttribute("ka:for")) {
            this._renderFor($scope, this.template.getAttribute("ka:for"));
        } else if (this.template.hasAttribute("ka:if")) {
            this._renderIf($scope, this.template.getAttribute("ka:if"));
        } else {
            if (typeof this.template._ka_active === "undefined") {
                this._appendTemplate();
                this.template._ka_active = true;
            }
            this._maintain($scope, this.template.__kachilds);
        }
    }
}

/* from app/getArgs.js */
/**
 * Return array of arguments of the function
 *
 * <example>
 *     function f1(arg1, arg2=null) {}
 *
 *     assert(KaToolsV1.getArgs(f1) === ["arg1", "arg2"])
 * </example>
 *
 * @param func
 * @returns {string[]}
 */
KaToolsV1.getArgs = (func) => {
    return (func + '')
        .replace(/[/][/].*$/mg,'') // strip single-line comments
        .replace(/^(.*?)=>.*$/s, (m, m1) => m1)
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',').filter(Boolean).map(e => e.replace(")", "")).filter(e => e !== "");
}

/* from app/provider.js */

KaToolsV1.provider = new class {

    constructor() {
        this._services = {};
    }



    async get(name) {
        return new Promise(async (resolve, reject) => {
            let service = this._services[name];
            if (typeof service === "undefined")
                return reject(`Provider cannot resolve '${name}'`)
            if(service.resolved)
                return resolve(service.value);
            service.promises.push(resolve);
            if (service.promises.length > 1)
                return;
            service.value = await service.cb(...await this.arguments(service.cb, service.params));
            service.resolved = true;
            service.promises.forEach(elem => elem(service.value));
        });
    }

    /**
     *
     * @param cb
     * @param params
     * @returns {Promise<Array>}
     */
    async arguments(cb, params = {}) {
        return new Promise(async (resolve, reject) => {
            let args = KaToolsV1.getArgs(cb);
            let retArgs = [];
            for(let i = 0; i < args.length; i++) {
                let argName = args[i];
                if(params[argName]) {
                    retArgs.push(params[argName]);
                    continue;
                }
                try {
                    retArgs.push(await this.get(argName))
                } catch(e) {
                    return reject(e);
                }
            }
            resolve(retArgs);
        });
    }


    defineValue(name, value) {
        this._services[name] = {
            value: value,
            resolved: true
        }
    }

    define(name, callback, params={}) {
        this._services[name] = {
            cb: callback,
            params: params,
            value: null,
            resolved: false,
            promises: []
        }
    }
}();

/* from ce/ce_define.js */


KaToolsV1.ce_define = (elementName, controller, template=null, waitEvent=null) => {
    let ctrlClass = null;
    if ( KaToolsV1.is_constructor(controller)) {
        ctrlClass = controller;
    } else {
        ctrlClass = class extends KaToolsV1_CustomElement{};
        ctrlClass.prototype.connected = controller;
    }

    ctrlClass.__tpl = template;
    ctrlClass.__waitEvent = waitEvent;

    customElements.define(elementName, ctrlClass);

}

/* from ce/html.js */


KaToolsV1.html = (htmlContent) => {
    let e = document.createElement("template");
    e.innerHTML = htmlContent;
    return e;
}

/* from ce/kaelement.js */

class KaToolsV1_CustomElement extends HTMLElement {
    static __runMethod = "connected";

    constructor(props) {
        super(props);
        /**
         *
         * @protected
         * @type {KaV1Renderer}
         */
        this.$tpl = null;


        this.__isConnected = false;
    }


    isConnected() {
        return this.isConnected;
    }

    async connectedCallback() {
        let renderer = null;
        let callback = this.connected;
        callback.bind(this);

        if (this.constructor.__tpl !== null) {
            let tpl = KaToolsV1.templatify(this.constructor.__tpl);
            this.appendChild(tpl);
            this.$tpl = new KaV1Renderer(tpl);
        }
        if (this.constructor.__waitEvent !== null) {
            let wd = this.constructor.__waitEvent.split("@");
            let eventName = wd[0];
            let target = document;
            if (wd.length === 2) {
                target = KaToolsV1.querySelector(wd[1]);
            }
            target.addEventListener(eventName, async (event) => {
                callback(... await KaToolsV1.provider.arguments(callback, {
                    "$this": this,
                    "$tpl": this.$tpl,
                    "$event": event
                }));
                this.__isConnected = true;
            })
            return;
        }

        callback(... await KaToolsV1.provider.arguments(callback, {
            "$this": this,
            "$tpl": this.$tpl
        }));
        this.__isConnected = true;
    }

}

/* from core/autostart.js */

(async ()=>{
    await KaToolsV1.domReady();

    // Unescape entities replaced by jekyll template engine
    for (let e of document.querySelectorAll("template[ka-unescape]")) {
        let data = e.innerHTML;
        e.innerHTML = data.replaceAll("&lt;", "<")
            .replaceAll("&amp;", "&")
            .replaceAll("&gt;", ">");
    }

    for (let e of document.querySelectorAll("template[ka-autostart]")) {
        let ne = document.importNode(KaToolsV1.querySelector("script", e.content), true).cloneNode(true);
        KaSelf = ne;
        if (e.nextElementSibling === null) {
            ne.parentNode.append(ne);
            continue;
        }
        e.parentNode.insertBefore(ne, e.nextElementSibling);
    }
})()

/* from core/router.js */

