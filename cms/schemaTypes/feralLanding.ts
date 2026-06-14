import {defineType, defineField} from 'sanity'

export const feralLanding = defineType({
  name: 'feralLanding',
  title: 'Landing Section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Name',
      type: 'string',
      validation: (rule: any) => rule.required(),
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
        defineField({ name: 'ja', title: '日本語', type: 'string' }),
      ],
    }),
    defineField({
      name: 'heroSubhead',
      title: 'Hero Subhead',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text' }),
        defineField({ name: 'ja', title: '日本語', type: 'text' }),
      ],
    }),
    defineField({
      name: 'aboutSummary',
      title: 'About Summary',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text' }),
        defineField({ name: 'ja', title: '日本語', type: 'text' }),
      ],
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Button Label',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string' }),
        defineField({ name: 'ja', title: '日本語', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
