import type { BlockId, Content } from './types'

export type { BlockId, BlockMeta, Card, Content, Role } from './types'

export const content: Content = {
  identity: {
    name: 'Konstantina Roumelioti',
    role: 'Technical Lead, Authoring Tools',
    team: 'Authoring Tools',
    company: 'LearnWorlds',
    location: 'Athens, Greece',
    locationShort: 'Athens, GR',
    headline: 'I build tools for builders.',
    intro:
      "Technical Lead of Authoring Tools at LearnWorlds. My team builds the editors and content-creation tools course creators use to reach tens of millions of learners. I'm a full-stack engineer with a frontend focus.",
    focusLine: 'Frontend-focused, full-stack',
  },
  links: {
    github: 'https://github.com/kwnna99',
    linkedin: 'https://www.linkedin.com/in/konstantina-roumelioti/',
    email: 'mailto:konstantinaroumelioti@gmail.com',
    bookstagram: 'https://www.instagram.com/kona.reads/',
    bookstagramHandle: '@kona.reads',
    jobPosting:
      'https://www.learnworlds.com/job/full-stack-software-engineer-authoring-tools-remote-greece-or-cyprus/',
    source: 'https://github.com/kwnna99/konstantina-dev',
  },
  now: [
    { title: 'Lead a team of 7', body: 'Organising the team and how we work.' },
    { title: 'Set the architecture', body: 'Vue.js frontend architecture and engineering practices.' },
    { title: 'Build team tooling', body: 'Productivity tools that take friction out of the day.' },
    { title: 'Automate triage', body: 'Automated flows that cut support-ticket triage time.' },
  ],
  stack: {
    tagline: 'Frontend-focused full-stack lead engineer · Vue, TypeScript, PHP',
    tags: [
      { name: 'Vue.js', color: '#42b883' },
      { name: 'TypeScript', color: '#3178c6' },
      { name: 'JavaScript', color: '#f7df1e' },
      { name: 'CSS', color: '#663399' },
      { name: 'PHP', color: '#777bb4' },
      { name: 'Laravel', color: '#ff2d20' },
      { name: 'MySQL', color: '#00758f' },
      { name: 'MongoDB', color: '#47a248' },
      { name: 'REST APIs', color: '#71717a' },
      { name: 'Git', color: '#f05032' },
      { name: 'AI-assisted development', color: '#d97757' },
    ],
  },
  howIWork: [
    { title: 'Calm (happy, even) under pressure', emphasis: true },
    { title: 'Transforming legacy code, and enjoying it', emphasis: true },
    { title: 'Leadership & mentoring' },
    { title: 'Clear communication' },
    { title: 'Working with Product & Design' },
    { title: 'End-to-end ownership' },
    { title: 'Problem solving' },
  ],
  languages: [
    { name: 'Greek', level: 'Native' },
    { name: 'English', level: 'Full professional' },
  ],
  career: [
    {
      title: 'Technical Lead, Authoring Tools',
      org: 'LearnWorlds',
      start: 'Jan 2026',
      end: null,
      summary:
        'Lead and organise a team of 7. Own Vue.js frontend architecture and engineering practices. Build team productivity tools. Reduced support-ticket triage time by automating our flows. AI-assisted development. Shape solutions with Product and Design.',
    },
    {
      title: 'Full Stack Engineer',
      org: 'LearnWorlds',
      start: 'Mar 2023',
      end: 'Jan 2026',
      summary:
        'Shipped features end to end across Vue.js and PHP/Laravel, from estimation through code review and release.',
    },
    {
      title: 'QA Engineer',
      org: 'LearnWorlds',
      start: 'Aug 2021',
      end: 'May 2023',
      summary:
        'Testing and bug reporting, second-line platform support, prioritising issues and user needs with Product.',
    },
    {
      title: 'Customer Support',
      org: 'LearnWorlds',
      start: 'Apr 2021',
      end: 'Aug 2021',
      summary:
        'Supported platform users. Wrote knowledge-base articles and a full guide for one of the add-ons.',
    },
  ],
  education: {
    degree: 'BSc Computer Science & Biomedical Informatics',
    school: 'University of Thessaly',
    start: '2017',
    end: '2022',
    note: 'Graduated first in class.',
  },
  offClock: {
    leadLine: "When I'm not reviewing code, I'm reviewing books.",
    items: [
      { title: 'Reading crime and romance', body: 'Reviews on @kona.reads' },
      { title: 'Coding for fun' },
      { title: 'European Youth Parliament alumna', body: '2014–2021' },
    ],
  },
  contact: {
    freelanceLine: 'Occasionally open to small freelance projects.',
  },
  blocks: [
    {
      id: 'hero',
      label: 'Hero',
      layerIcon: 'H',
      description: 'The first thing people see',
      properties: [
        ['name', 'Konstantina'],
        ['role', 'Technical Lead'],
        ['focus', 'frontend → fullstack'],
        ['team', 'Authoring Tools'],
        ['company', 'LearnWorlds'],
        ['based', 'Athens, GR'],
        ['hiring', 'true'],
      ],
    },
    {
      id: 'now',
      label: 'Now',
      layerIcon: '◆',
      description: 'What a normal week looks like',
      properties: [
        ['team_size', '7'],
        ['owns', 'Vue architecture'],
        ['builds', 'team tooling'],
        ['automates', 'ticket triage'],
        ['ai_assisted', 'always'],
      ],
    },
    {
      id: 'stack',
      label: 'Stack',
      layerIcon: '▦',
      description: 'Daily drivers',
      properties: [
        ['frontend', 'Vue · TS · JS · CSS'],
        ['backend', 'PHP · Laravel'],
        ['data', 'MySQL · MongoDB'],
        ['apis', 'REST'],
      ],
    },
    {
      id: 'how',
      label: 'How I work',
      layerIcon: '✦',
      description: "The soft skills that aren't soft",
      properties: [
        ['under_pressure', 'thriving'],
        ['legacy_code', 'happily refactored'],
        ['works_with', 'Product · Design'],
        ['team_size', '7'],
      ],
    },
    {
      id: 'languages',
      label: 'Languages',
      layerIcon: '文',
      description: 'What I speak',
      properties: [
        ['greek', 'native'],
        ['english', 'full professional'],
        ['remote_ready', 'true'],
      ],
    },
    {
      id: 'career',
      label: 'Career',
      layerIcon: '↧',
      description: 'Same company, every seat',
      properties: [
        ['years', '5.5+'],
        ['roles', '4'],
        ['promotions', '3'],
        ['started_as', 'Support'],
        ['degree', 'CS & BMI, 1st in class'],
      ],
    },
    {
      id: 'offclock',
      label: 'Off the clock',
      layerIcon: '☕',
      description: 'The human side',
      properties: [
        ['reading', 'crime · romance'],
        ['reviews', '@kona.reads'],
        ['side_hobby', 'coding'],
        ['eyp_alumna', '2014–2021'],
      ],
    },
    {
      id: 'contact',
      label: 'Contact',
      layerIcon: '@',
      description: 'Low-key on purpose',
      properties: [
        ['github', 'kwnna99'],
        ['linkedin', 'konstantina-roumelioti'],
        ['freelance', 'sometimes'],
        ['hire_me_banners', '0'],
      ],
    },
  ],
}

export const DEFAULT_ORDER: BlockId[] = content.blocks.map(b => b.id)
