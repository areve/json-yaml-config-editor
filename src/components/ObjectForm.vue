<template>
  <div class="ui container">
    <div v-if="json || yaml" class="ui top tabular menu" :class="{attached: json || yaml}">
      <a class="item" :class="{ active: tab === 'form' }" @click="openTab('form')">
        Form
      </a>
      <a v-if="json" class="item" :class="{ active: tab === 'json' }" @click="openTab('json')">
        JSON
      </a>
      <a v-if="yaml" class="item" :class="{ active: tab === 'yaml' }" @click="openTab('yaml')">
        YAML
      </a>
    </div>

    <div class="ui attached " :class="{segment: json || yaml}" v-if="tab === 'form'">
      <template v-for="(item, key) in data" v-if="fieldType(key, item) !== 'object' && key[0] !== '$'">
        <div class="field" :key="key + '_checkbox'" v-if="fieldType(key,item) === 'checkbox'">
          <div class="ui checkbox">
            <input tabindex="0" type="checkbox" v-model="data[key]">
            <label>{{fromCamelCase(key)}}</label>
          </div>
        </div>
        <div class="field" v-else-if="fieldType(key, item) === 'color'" :key="key + '_text'">
          <div class="ui color">
            <input tabindex="0" type="color" v-model="data[key]">
            <label>{{fromCamelCase(key)}}</label>
          </div>
        </div>
        <div class="field" v-else-if="fieldType(key, item) === 'text'" :key="key + '_text'">
          <label>{{fromCamelCase(key)}}</label> <input v-model="data[key]" placeholder="">
        </div>
        <div class="field" v-else-if="fieldType(key, item) === 'number'" :key="key + '_number'">
          <label>{{fromCamelCase(key)}}</label> <input v-model.number="data[key]" type="number">
        </div>
      </template>

      <div v-if="form" class="ui form">
        <div :is="form" :name="key" :data="item" v-for="(item, key) in data" v-if="fieldType(key, item) === 'object'" :key="key"></div>
      </div>

      <div class="ui styled fluid accordion" v-else-if="containsAnyObjects(data)" ref="accordion">
        <template v-for="(item, key) in data" v-if="!hidden(item) && fieldType(key, item) === 'object' && key[0] !== '$'">
          <div class="title" :class="{ active: isOpen(key)}" @click="toggle(key)" :key="key + '_title'"><i class="dropdown icon"></i> {{fromCamelCase(item.name || (item.properties && item.properties.name) || key)}}
            <button v-if="template && isOpen(key)" class="ui right floated compact button" @click="confirmRemove(data, key)">
              <i class="remove icon"></i> Remove
            </button>
          </div>
          <div class="content" :class="{ active: isOpen(key)}" :key="key + '_content'">
            <object-form :data="data[key]" :name="key" :options="options" />
          </div>
        </template>
      </div>
    </div>

    <div class="ui attached segment" v-if="tab === 'json'">
      <codemirror ref="jsonCodemirror" :value="jsonData" :options="yamlCodemirrorOptions" @input="jsonChanged">
      </codemirror>
    </div>
    <div class="ui attached segment" v-if="tab === 'yaml'">
      <codemirror ref="yamlCodemirror" :value="yamlData" :options="yamlCodemirrorOptions" @input="yamlChanged">
      </codemirror>
    </div>

    <div class="ui" v-if="template && tab === 'form'">
      <div class="ui basic clearing segment button-bar">
        <button class="ui right floated compact button" @click="add(data, template)"> <i class="add icon"></i> Add</button>
      </div>
    </div>

    <div class="ui dimmer modals page top aligned transition" :class="{'active visible': configRemoveItem}">
      <div class="ui special modal transition active visible">
        <div class="header">
          Confirm
        </div>
        <div class="content">
          <p>Remove <strong>{{fromCamelCase(configRemoveItem && configRemoveItem.name)}}</strong>?</p>
        </div>
        <div class="actions">
          <div class="ui negative right labeled icon button" @click="cancelRemove">
            Cancel
            <i class="cancel icon" />
          </div>
          <div class="ui positive right labeled icon button" @click="remove">
            OK
            <i class="check icon" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ColorForm from '@/components/ColorForm'
import fromCamelCase from '@/lib/fromCamelCase'
import schema from '@/lib/schema'
import eventBus from '@/lib/eventBus'
import yaml from 'js-yaml'
import { applyChange, observableDiff } from 'deep-diff'
import { codemirror } from 'vue-codemirror'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/indent-fold.js'
import 'codemirror/addon/fold/foldgutter.css'

export default {
  name: 'ObjectForm',
  props: ['data', 'options'],
  components: {
    ColorForm,
    codemirror
  },
  data () {
    return {
      $tab: 'form',
      jsonData: '',
      yamlData: '',
      openItems: {},
      fields: {},
      configRemoveItem: null,
      yamlCodemirrorOptions: {
        lineNumbers: true,
        mode: 'yaml',
        foldGutter: true,
        indentUnit: 2,
        lineWrapping: true,
        scrollbarStyle: 'null',
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
      }
    }
  },
  computed: {
    tab () {
      if (this.json && this.$data.$tab === 'json') {
        return 'json'
      }
      if (this.yaml && this.$data.$tab === 'yaml') {
        return 'yaml'
      }
      return 'form'
    },
    form () {
      return this.data.$schema && this.data.$schema.form
    },
    template () {
      return this.data.$schema && this.data.$schema.template
    },
    yaml () {
      return this.options && this.options.yaml
    },
    json () {
      return this.options && this.options.json
    }
  },
  mounted () {
    eventBus.$on('batchUpdated', () => {
      this.$forceUpdate()
    })
  },
  methods: {
    fromCamelCase,
    fieldType (key, item) {
      if (!(key in this.fields)) {
        if (typeof item === 'boolean') {
          this.fields[key] = 'checkbox'
        } else if (typeof item === 'number') {
          this.fields[key] = 'number'
        } else if (typeof item === 'string' && /^#[0-9a-f]{6}$/i.test(item)) {
          this.fields[key] = 'color'
        } else if (typeof item === 'string') {
          this.fields[key] = 'text'
        } else if (typeof item === 'object') {
          this.fields[key] = 'object'
        }
      }
      return this.fields[key]
    },
    toggle (key) {
      this.$set(this.openItems, key, !this.openItems[key])
    },
    setOpen (key, value) {
      this.$set(this.openItems, key, value)
    },
    isOpen (key) {
      return this.openItems[key]
    },
    yamlChanged (data) {
      const parsed = yaml.safeLoad(data)
      this.loadData(parsed)
    },
    jsonChanged (data) {
      const parsed = JSON.parse(data)
      this.loadData(parsed)
    },
    openTab (tab) {
      if (tab === 'json') {
        this.jsonData = JSON.stringify(schema.remove(this.data), null, '  ')
      } else if (tab === 'yaml') {
        this.yamlData = yaml.safeDump(schema.remove(this.data))
      }
      this.$data.$tab = tab
    },
    loadData (data) {
      observableDiff(this.data, data, diff => {
        applyChange(this.data, data, diff)
      })
      eventBus.$emit('batchUpdated')
    },
    hidden (item) {
      return item.$schema && item.$schema.hidden
    },
    containsAnyObjects (collection) {
      for (const key in collection) {
        if (typeof collection[key] === 'object' && key[0] !== '$') {
          return true
        }
      }
      return false
    },
    add (collection, template) {
      collection.push(Object.assign({}, template))
      this.setOpen(collection.length - 1, true)
      this.$forceUpdate()
    },
    confirmRemove (collection, key) {
      this.configRemoveItem = {
        collection,
        key,
        name: collection[key].name
      }
    },
    cancelRemove (collection, key) {
      this.configRemoveItem = null
    },
    remove () {
      this.setOpen(this.configRemoveItem.key, false)
      this.configRemoveItem.collection.splice(this.configRemoveItem.key, 1)
      this.configRemoveItem = null
      this.$forceUpdate()
    }
  }
}
</script>

<style lang="scss" scoped>
.ui textarea:not([rows]) {
  height: 40em;
  max-height: 40em;
  font-family: monospace;
}
.button-bar {
  padding-right: 0;
  padding-left: 0;
  padding-bottom: 0;
}
</style>
