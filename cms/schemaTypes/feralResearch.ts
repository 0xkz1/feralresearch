import {defineType, defineField} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

export const feralResearch = defineType({
  name: 'feralResearch',
  title: 'Research Entry',
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
      name: 'prompt',
      title: 'Prompt',
      type: 'text',
      description: 'The original research / generation prompt',
    }),
    defineField({
      name: 'runType',
      title: 'Run Type',
      type: 'string',
      options: {
        list: [
          { title: 'Pipeline', value: 'pipeline' },
          { title: 'Field', value: 'field' },
          { title: 'Visual', value: 'visual' },
          { title: 'Ecosystem', value: 'ecosystem' },
          { title: 'Ingestion', value: 'ingestion' },
        ],
      },
      validation: (rule: any) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',
      validation: (rule: any) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Completed', value: 'completed' },
          { title: 'In Progress', value: 'in-progress' },
          { title: 'Failed', value: 'failed' },
          { title: 'Queued', value: 'queued' },
        ],
      },
      initialValue: 'completed',
    }),
    defineField({
      name: 'content',
      title: 'Response / Output',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'text' }),
        defineField({ name: 'ja', title: '日本語', type: 'text' }),
      ],
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          { title: 'Pipeline (auto)', value: 'pipeline' },
          { title: 'Manual CMS entry', value: 'cms' },
        ],
      },
      initialValue: 'cms',
    }),
    defineField({
      name: 'labels',
      title: 'Labels / Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show on landing page activity feed',
      initialValue: false,
    }),
    orderRankField({ type: 'feralResearch' }),
  ],
  preview: {
    select: {
      titleEn: 'title.en',
      titleJa: 'title.ja',
      subtitle: 'runType',
    },
    prepare({ titleEn, titleJa, subtitle }: any) {
      return {
        title: titleEn || titleJa || 'Untitled Entry',
        subtitle: `${subtitle || 'unknown'} · ${titleJa ? titleJa : ''}`,
      }
    },
  },
  orderings: [orderRankOrdering],
})
