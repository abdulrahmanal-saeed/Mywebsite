const { query, one } = require('./db');

const SETTINGS = {
  full_name: 'Abdulrahman El-Saeed Hassan',
  headline: 'Account Management · Client Relations · B2B Business Development',
  tagline:
    'I build long-term client relationships and turn them into revenue: 5+ years across the UAE and Egypt in corporate sales, account development and client-facing leadership.',
  location: 'Dubai, UAE',
  email: 'info@abdulrahmanalsaeed.com',
  phone: '+971 52 311 3472',
  whatsapp: '971504085666',
  linkedin: 'https://www.linkedin.com/in/abdulrahmanalsaeed5',
  open_to_work: '1',
  availability: 'Open to new opportunities in Dubai & the UAE',
  summary:
    'B2B client relationship and business development professional with 5+ years of experience across the UAE and Egypt, covering corporate sales, account development, retail operations, and client-facing leadership.\n\nProven record of securing 190+ corporate contracts, exceeding monthly targets for 10 consecutive months, and progressing into a supervisory role in Dubai. Currently building experience in IT staffing and professional services, with a focus on client meetings, relationship development, requirement discovery, CRM pipeline management, proposals, and cross-functional coordination.\n\nArabic native speaker with professional English and a valid UAE driving licence.',
  seo_title: 'Abdulrahman El-Saeed | Account Management & B2B Business Development, Dubai',
  seo_description:
    'Client relationship and B2B business development professional in Dubai with 5+ years across the UAE and Egypt. 190+ corporate contracts secured.',
  show_achievements: '1',
  show_experience: '1',
  show_skills: '1',
  show_education: '1',
  show_certifications: '1',
  show_contact: '1',
  contact_eyebrow: 'Contact',
  contact_title: "Let's talk about how I can help your team",
  contact_lead:
    'Hiring for account management, client relations or business development? Send a message or reach me directly.',
  contact_button: 'Send message',
  contact_success: 'Thank you! Your message has been sent. I will get back to you soon.',
  contact_whatsapp_label: 'Chat with me',
  contact_linkedin_label: 'View profile',
  show_contact_form: '1',
  show_contact_email: '1',
  show_contact_phone: '1',
  show_contact_whatsapp: '1',
  show_contact_linkedin: '1',
  show_whatsapp_button: '1',
  footer_text: '© {year} {name} · {location}',
  footer_links: 'Download CV | /cv\nLinkedIn | {linkedin}\nEmail | mailto:{email}',
  photo_asset: '',
  photo_shape: 'circle',
  cv_asset: '',
};

const EXPERIENCES = [
  {
    title: 'Client Relationship Executive',
    company: 'Nair Systems EMEA FZ-LLC',
    location: 'Dubai, UAE',
    start_label: 'Sep 2026',
    end_label: 'Present',
    is_current: 1,
    bullets: [
      'Develop and maintain relationships with corporate prospects and clients across banking, finance, insurance, and other UAE sectors.',
      'Conduct field visits and client meetings to understand business requirements, build trust with decision-makers, and identify opportunities for IT staffing and professional services.',
      'Coordinate with recruitment and internal delivery teams to translate client requirements into suitable resource and service solutions.',
      'Support business development across onsite IT professional services and related technology solutions, including cloud, cyber security, applications, and infrastructure support.',
      'Maintain structured follow-up on opportunities, client interactions, requirements, and next steps to support pipeline visibility and relationship continuity.',
    ],
  },
  {
    title: 'Sales Supervisor',
    company: 'Early Learning Centre, ALGT Group (formerly Kamal Osman Jamjoom)',
    location: 'Dubai, UAE',
    start_label: 'Jan 2025',
    end_label: 'Apr 2026',
    bullets: [
      'Led daily store operations, staff scheduling, task delegation, customer service, and sales execution while maintaining merchandising and operational standards.',
      'Retained in role following the company acquisition, reflecting consistent performance and trust across two management teams.',
      'Contributed to the branch achieving its sales target in its first year under the new company structure.',
      'Prepared daily sales, stock, and operational reports for the Area Manager and resolved customer escalations to protect service quality and loyalty.',
    ],
  },
  {
    title: 'Sales Assistant',
    company: 'Early Learning Centre, Kamal Osman Jamjoom Group',
    location: 'Dubai, UAE',
    start_label: 'Dec 2022',
    end_label: 'Dec 2024',
    bullets: [
      'Promoted to Sales Supervisor after consistently exceeding sales targets and service standards.',
      'Built customer relationships through face-to-face needs discovery, product guidance, cross-selling, and up-selling in a multicultural retail environment.',
      'Managed POS transactions, cash reconciliation, restocking, inventory accuracy, and day-to-day customer inquiries.',
    ],
  },
  {
    title: 'Sales Executive',
    company: 'Xiaomi',
    location: 'Egypt',
    start_label: 'Aug 2020',
    end_label: 'Mar 2022',
    bullets: [
      'Exceeded monthly sales targets for 10 consecutive months while managing a pipeline across retail, B2C, and corporate opportunities.',
      'Generated and developed new business opportunities through networking, social media, events, and direct outreach to prospective clients.',
      'Delivered product demonstrations and presentations, negotiated pricing, and closed deals with corporate and retail clients.',
      'Prepared sales reports and forecasts and coordinated with supply chain teams to maintain stock availability for key accounts.',
      'Represented the brand at exhibitions and conferences, developing new leads and partnership opportunities.',
    ],
  },
  {
    title: 'Business Development Associate',
    company: 'Aqarmap',
    location: 'Egypt',
    start_label: 'Jun 2019',
    end_label: 'Feb 2020',
    bullets: [
      'Secured contracts with 190 companies and was recognized as an overachiever three times for strong business development performance.',
      'Identified and qualified business opportunities by assessing client requirements, resources, budgets, and commercial potential.',
      'Built long-term advisory relationships with key stakeholders and decision-makers and maintained consistent account follow-up.',
      'Prepared proposals and delivered client presentations to win new accounts and support commercial negotiations.',
      'Worked with Operations, Projects, and Sourcing teams to develop competitive sales strategies and improve client outcomes.',
    ],
  },
];

const ACHIEVEMENTS = [
  { value: '5+', label: 'Years of experience', detail: 'Across the UAE and Egypt' },
  { value: '190+', label: 'Corporate contracts secured', detail: 'Business development at Aqarmap' },
  { value: '10', label: 'Consecutive months over target', detail: 'Sales Executive at Xiaomi' },
  { value: '3×', label: 'Overachiever recognition', detail: 'For business development performance' },
];

const SKILLS = {
  'Core Skills': [
    'Account Management', 'Client Relationship Management', 'Partnerships', 'B2B Business Development',
    'Stakeholder Management', 'Client Meetings & Presentations', 'Proposal & Quotation Coordination',
    'Pipeline Management', 'CRM Management', 'Negotiation & Closing', 'Client Retention',
    'Cross-selling & Upselling', 'Market Research', 'Sales Reporting & Forecasting', 'Team Leadership',
    'Retail Operations',
  ],
  'CRM & Tools': ['Salesforce', 'Zoho CRM', 'Microsoft Office', 'Microsoft Excel', 'Google Sheets', 'POS Systems'],
  Languages: ['Arabic (Native)', 'English (B2, Professional Working)'],
  Additional: ['Valid UAE Driving Licence'],
};

const EDUCATION = [
  {
    degree: 'Bachelor of Management Information Systems',
    school: 'Cairo University, Egypt',
    year_label: '2020',
    details: 'Relevant coursework: Database Management, Systems Analysis, Business Analytics, Statistics, Marketing',
  },
  {
    degree: 'Business Administration Diploma',
    school: 'Paris International University (Online)',
    year_label: '2025',
    details: 'Curriculum: Strategy, Marketing, Finance, Operations, Organizational Behaviour',
  },
];

const CERTIFICATIONS = [
  { title: 'Data Analysis', issuer: 'Route Egypt', year_label: '2026', status: 'In Progress' },
  { title: 'Online Market Research', issuer: 'E3mel Business', year_label: '2024' },
  { title: 'Consumer Behaviour', issuer: 'E3mel Business', year_label: '2023' },
  { title: 'Sales Management', issuer: 'E3mel Business', year_label: '2023' },
  { title: 'Excel', issuer: 'Route Egypt', year_label: '2022' },
];

async function insertAll(table, rows) {
  let order = 0;
  for (const row of rows) {
    order += 10;
    const data = { ...row, sort_order: order };
    await query(`INSERT INTO ${table} SET ?`, [data]);
  }
}

async function seed() {
  const done = await one("SELECT value FROM settings WHERE name = 'seeded'");
  if (done) return false;

  for (const [name, value] of Object.entries(SETTINGS)) {
    await query('INSERT IGNORE INTO settings (name, value) VALUES (?, ?)', [name, value]);
  }
  await insertAll('experiences', EXPERIENCES.map((e) => ({ ...e, bullets: e.bullets.join('\n') })));
  await insertAll('achievements', ACHIEVEMENTS);
  const skills = [];
  for (const [category, names] of Object.entries(SKILLS)) {
    for (const name of names) skills.push({ name, category });
  }
  await insertAll('skills', skills);
  await insertAll('education', EDUCATION);
  await insertAll('certifications', CERTIFICATIONS);
  await query("INSERT INTO settings (name, value) VALUES ('seeded', '1')");
  return true;
}

module.exports = { seed, DEFAULT_SETTINGS: SETTINGS };
