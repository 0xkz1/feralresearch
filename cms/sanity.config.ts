import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'
import {ImagesIcon, ComposeIcon} from '@sanity/icons'

export default defineConfig({
  name: 'default',
  title: 'Feral Research CMS',

  projectId: '5ha2hgsc',
  dataset: 'production',

  plugins: [structureTool({
    structure: (S: any, context: any) =>
      S.list()
        .title('Content')
        .items([
          S.listItem()
            .title('Site Settings')
            .icon(() => '⚙️')
            .child(S.document().schemaType('feralSiteSettings').documentId('feral-site-settings')),
          S.divider(),
          orderableDocumentListDeskItem({
            type: 'feralResearch',
            title: 'Research Entries',
            icon: ComposeIcon,
            S,
            context,
          }),
          orderableDocumentListDeskItem({
            type: 'feralGallery',
            title: 'Gallery',
            icon: ImagesIcon,
            S,
            context,
          }),
          ...S.documentTypeListItems().filter(
            (listItem: any) => !['feralSiteSettings', 'feralResearch', 'feralGallery'].includes(listItem.getId())
          ),
        ]),
  }), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
