import {defineType, defineField} from 'sanity'

export const feralDashboard = defineType({
  name: 'feralDashboard',
  title: 'Dashboard Config',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Name',
      type: 'string',
      validation: (rule: any) => rule.required(),
    }),
    defineField({
      name: 'featuredStats',
      title: 'Featured Stats',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'object',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'string', validation: (Rule: any) => Rule.required() }),
                defineField({ name: 'ja', title: '日本語', type: 'string' }),
              ],
            }),
            defineField({ name: 'value', title: 'Fallback Value', type: 'string' }),
            defineField({ name: 'endpoint', title: 'API Key', type: 'string', description: 'Key in the sidecar stats response to display' }),
          ],
          preview: { select: { title: 'label.en', subtitle: 'endpoint' } },
        },
      ],
    }),
    defineField({
      name: 'endpoints',
      title: 'API Endpoints',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'method', title: 'Method', type: 'string', options: { list: ['GET', 'POST'] } }),
            defineField({ name: 'path', title: 'Path', type: 'string', validation: (Rule: any) => Rule.required() }),
            defineField({ name: 'description', title: 'Description', type: 'object',
              fields: [
                defineField({ name: 'en', title: 'English', type: 'string' }),
                defineField({ name: 'ja', title: '日本語', type: 'string' }),
              ],
            }),
          ],
          preview: { select: { title: 'path', subtitle: 'method' } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
