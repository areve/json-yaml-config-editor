<template>

  <section id="root" class="ui form container">
    <div class="ui basic clearing segment unpadded">
      <button class="ui primary right floated  labeled icon button" @click="save">
        Save <i class="save icon"></i>
      </button>
      <button class="ui right floated labeled icon button" @click="showSettings">
        Settings <i class="settings icon"></i>
      </button>
    </div>
    <object-form :data="config" :options="{ json, yaml }" />

    <div class="ui dimmer modals page top aligned transition" :class="{'active visible': settingsDialog || savedDialog}">
      <div v-if="settingsDialog" class="ui special modal transition active visible">
        <div class="header">
          Settings
        </div>
        <div class="content form">
          <div class="ui field">
            <div class="ui checkbox">
              <input type="checkbox" v-model="advanced" id="advanced">
              <label for="advanced">Show advanced options</label>
            </div>
          </div>
          <div class="ui field">
            <div class="ui checkbox">
              <input type="checkbox" v-model="yaml" id="yaml">
              <label for="yaml">Show yaml tab</label>
            </div>
          </div>
          <div class="ui field">
            <div class="ui checkbox">
              <input type="checkbox" v-model="json" id="json">
              <label for="json">Show json tab</label>
            </div>
          </div>
          <div class="ui field">
            <div class="ui checkbox">
              <input type="checkbox" v-model="documentation" id="documentation">
              <label for="documentation">Show documentation</label>
            </div>
          </div>
        </div>
        <div class="actions">
          <div class="ui positive right labeled icon button" @click="showSettings">
            Done
            <i class="icon check" />
          </div>
        </div>
      </div>
      <div v-if="savedDialog" class="ui special modal transition active visible">
        <div class="header">
          Success
        </div>
        <div class="content">
          <p>Saved to local storage.</p>
        </div>
        <div class="actions">
          <div class="ui positive right labeled icon button" @click="savedDialog = false">
            OK
            <i class="icon check" />
          </div>
        </div>
      </div>
    </div>

    <div class="ui basic segment">
      <section v-if="documentation">
        <h3>Documentation</h3>
        <p>There is isn't any documentation yet! But there is a list of bugs and suggestions.</p>
        <h3>Suggestions</h3>
        <ul>
          <li>A tool to generate schema rules</li>
          <li>A tool to generate a custom form</li>
          <li>A demonstration of the custom form functionality</li>
          <li>A some example data</li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script>
import ObjectForm from '@/components/ObjectForm'
import schema from '@/lib/schema'
import eventBus from '@/lib/eventBus'

const rules = {
  '$.advanced': {
    hidden: true
  },
  '$.operators': {
    hidden: false,
    template: {
      enabled: false,
      name: 'New Operator'
    }
  },
  '$.system.oldColours': {
    hidden: false,
    form: 'color-form',
    template: null
  }
}

export default {
  name: 'Root',
  components: {
    ObjectForm
  },
  data () {
    return {
      config: {},
      json: true,
      yaml: false,
      advanced: false,
      documentation: false,
      settingsDialog: false,
      savedDialog: false
    }
  },
  mounted () {
    eventBus.$on('batchUpdated', () => {
      schema.add(this.config, rules)
    })
    this.load()
  },
  methods: {
    load () {
      this.config = JSON.parse(localStorage.getItem('config') || '{}')
      eventBus.$emit('batchUpdated')
    },
    save () {
      localStorage.setItem(
        'config',
        JSON.stringify(schema.remove(this.config))
      )
      this.savedDialog = true
    },
    showSettings () {
      this.settingsDialog = !this.settingsDialog
      rules['$.advanced'].hidden = !this.advanced
      schema.add(this.config, rules)
    }

  }
}
</script>
<style lang="scss">
#root {
  padding: 1em 0;
}

.off {
  opacity: 0.5;
}

.unpadded {
  padding: 0;
}

.ui.dimmer {
  z-index: -1 !important;
  transition: all 0.4s;
  transition-property: opacity, z-index;
  display: block;
}

.ui.dimmer.visible {
  z-index: 100 !important;
}

.modal {
  position: relative !important;
}

label {
  cursor: pointer !important;
}
</style>
