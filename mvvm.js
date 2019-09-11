function Mvvm(options = {}) {
    this.$options = options
    let data = this._data = this.$options.data

    observe(data)
    for (let key in data) {
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this._data[key]
            },
            set(newValue) {
                this._data[key] = newValue
            }
        })
    }

    new Compile(options.el, this)
}

function Observe(data) {
    for (let key in data) {
        let val = data[key]
        observe(data[key])
        Object.defineProperty(data, key, {
            configurable: true,
            get() {
                return val
            },
            set(newValue) {
                if (val === newValue) {
                    return
                }
                val = newValue
                observe(newValue)
            }
        })
    }
}

function observe(data) {
    if (!data || typeof data !== 'object') return
    new Observe(data)
}

function Compile(el, vm) {
    vm.$el = document.querySelector(el)
    let fragment = document.createDocumentFragment()

    while (child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }

    function replace(frag) {
        let arrChildNodes = Array.from(frag.childNodes)
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent
            let reg = /\{\{(.*?)\}\}/g
            if (node.nodeType === 3 && reg.test(txt)) {
                console.log(RegExp.$1)
                let arr = RegExp.$1.split('.')
                let val = vm
                arr.forEach(key => {
                    val = val[key]
                })
                node.textContent = txt.replace(reg, val).trim()
            }
            if (node.childNodes && node.childNodes.length) {
                replace(node)
            }
        })
    }

    replace(fragment)

    vm.$el.appendChild(fragment)
}