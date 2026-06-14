import {defineType, defineField} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

export const feralGallery = defineType({
  name: 'feralGallery',
  title: 'Gallery Item',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'string', validation: (rule: any) => rule.required() }),
        defineField({ name: 'ja', title: '日本語', type: 'string' }),
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en', maxLength: 96 },
      validation: (rule: any) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule: any) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text' }),
        defineField({ name: 'ja', title: '日本語', type: 'text' }),
      ],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Portrait', value: 'portrait' },
          { title: 'Landscape', value: 'landscape' },
          { title: 'Diagram', value: 'diagram' },
          { title: 'Field Photo', value: 'field-photo' },
          { title: 'Generated', value: 'generated' },
        ],
      },
      validation: (rule: any) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show on landing page',
      initialValue: false,
    }),
    orderRankField({ type: 'feralGallery' }),
  ],
  preview: {
    select: {
      titleEn: 'title.en',
      titleJa: 'title.ja',
      media: 'image',
      subtitle: 'category',
    },
    prepare({ titleEn, titleJa, media, subtitle }: any) {
      return {
        title: titleEn || titleJa || 'Untitled',
        subtitle: `${subtitle || 'unknown'}${titleJa ? ` · ${titleJa}` : ''}`,
        media,
      }
    },
  },
  orderings: [orderRankOrdering],
})
