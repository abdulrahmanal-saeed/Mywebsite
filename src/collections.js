// Each collection drives the generic list/form screens in the admin panel.
// Field types: text, textarea, lines (one item per line), number, checkbox, url, select, file.

const visible = { name: 'visible', label: 'Show on website', type: 'checkbox', default: 1 };

const collections = {
  experience: {
    table: 'experiences',
    title: 'Experience',
    singular: 'Position',
    hint: 'Your jobs, shown as a timeline. Newest should be at the top.',
    columns: ['title', 'company', 'start_label', 'end_label'],
    fields: [
      { name: 'title', label: 'Job title', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text', placeholder: 'Dubai, UAE' },
      { name: 'start_label', label: 'Start', type: 'text', placeholder: 'Jan 2025' },
      { name: 'end_label', label: 'End', type: 'text', placeholder: 'Present' },
      { name: 'is_current', label: 'This is my current job', type: 'checkbox' },
      { name: 'bullets', label: 'Responsibilities & results', type: 'lines', help: 'One bullet point per line.' },
      visible,
    ],
  },
  achievements: {
    table: 'achievements',
    title: 'Achievements',
    singular: 'Achievement',
    hint: 'The big numbers shown under the hero section.',
    columns: ['value', 'label', 'detail'],
    fields: [
      { name: 'value', label: 'Number / value', type: 'text', required: true, placeholder: '190+' },
      { name: 'label', label: 'Label', type: 'text', required: true, placeholder: 'Corporate contracts secured' },
      { name: 'detail', label: 'Small detail line', type: 'text', placeholder: 'Business development at Aqarmap' },
      visible,
    ],
  },
  skills: {
    table: 'skills',
    title: 'Skills',
    singular: 'Skill',
    hint: 'Skills are grouped on the website by category, in the order below.',
    columns: ['name', 'category'],
    fields: [
      { name: 'name', label: 'Skill', type: 'text', required: true },
      {
        name: 'category',
        label: 'Category',
        type: 'text',
        required: true,
        list: 'skill-categories',
        options: ['Core Skills', 'CRM & Tools', 'Languages', 'Additional'],
        help: 'Pick an existing category or type a new one.',
      },
      visible,
    ],
  },
  education: {
    table: 'education',
    title: 'Education',
    singular: 'Education',
    columns: ['degree', 'school', 'year_label'],
    fields: [
      { name: 'degree', label: 'Degree / programme', type: 'text', required: true },
      { name: 'school', label: 'School / university', type: 'text', required: true },
      { name: 'year_label', label: 'Year', type: 'text', placeholder: '2020' },
      { name: 'details', label: 'Details', type: 'textarea' },
      visible,
    ],
  },
  certifications: {
    table: 'certifications',
    title: 'Certifications',
    singular: 'Certification',
    hint: 'Courses and certificates. Upload the certificate (image or PDF) to show a "View" link.',
    columns: ['title', 'issuer', 'year_label', 'status'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'issuer', label: 'Issuer', type: 'text' },
      { name: 'year_label', label: 'Year', type: 'text' },
      { name: 'status', label: 'Status', type: 'text', placeholder: 'In Progress (leave empty if completed)' },
      { name: 'url', label: 'Verification link', type: 'url' },
      { name: 'asset_id', label: 'Certificate file (image or PDF)', type: 'file', accept: 'image/*,application/pdf' },
      visible,
    ],
  },
};

module.exports = collections;
