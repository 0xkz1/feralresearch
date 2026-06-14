import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '5ha2hgsc',
    dataset: 'production'
  },
  deployment: {
    autoUpdates: true,
  }
})
