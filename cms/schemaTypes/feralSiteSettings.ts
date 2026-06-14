import {defineType, defineField} from 'sanity'

export const feralSiteSettings = defineType({
  name: 'feralSiteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
        defineField({ name: 'ja', title: '日本語', type: 'string' }),
      ],
    }),
    defineField({
      name: 'heroText',
      title: 'Hero / Tagline',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text' }),
        defineField({ name: 'ja', title: '日本語', type: 'text' }),
      ],
    }),
    defineField({
      name: 'aboutText',
      title: 'About / Mission',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text' }),
        defineField({ name: 'ja', title: '日本語', type: 'text' }),
      ],
    }),
    defineField({
      name: 'howItWorks',
      title: 'How It Works',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'object',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule: any) => Rule.required() }),
                defineField({ name: 'ja', title: '日本語', type: 'string', validation: (Rule: any) => Rule.required() }),
              ],
            }),
            defineField({ name: 'description', title: 'Description', type: 'object',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'text', validation: (Rule: any) => Rule.required() }),
                defineField({ name: 'ja', title: '日本語', type: 'text', validation: (Rule: any) => Rule.required() }),
              ],
            }),
          ],
          preview: { select: { title: 'label.en', subtitle: 'description.en' } },
        },
      ],
    }),
    defineField({
      name: 'ctaText',
      title: 'CTA Text',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
        defineField({ name: 'ja', title: '日本語', type: 'string' }),
      ],
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
        defineField({ name: 'ja', title: '日本語', type: 'string' }),
      ],
    }),
    defineField({
      name: 'pipelineStages',
      title: 'Pipeline Stages',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'object',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule: any) => Rule.required() }),
                defineField({ name: 'ja', title: '日本語', type: 'string' }),
              ],
            }),
            defineField({ name: 'description', title: 'Description', type: 'object',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'text' }),
                defineField({ name: 'ja', title: '日本語', type: 'text' }),
              ],
            }),
          ],
          preview: { select: { title: 'name.en', subtitle: 'description.en' } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'siteName.en', subtitle: 'Site-wide settings' },
  },
})
