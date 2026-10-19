export type BlockId = 'hero' | 'now' | 'stack' | 'how' | 'languages' | 'career' | 'offclock' | 'contact'

export interface BlockMeta {
  id: BlockId
  label: string
  layerIcon: string
  description: string
  properties: Array<[key: string, value: string]>
}

export interface Card {
  title: string
  body?: string
  emphasis?: boolean
}

export interface Role {
  title: string
  org: string
  start: string
  end: string | null
  summary: string
}

export interface Content {
  identity: {
    name: string
    role: string
    team: string
    company: string
    location: string
    locationShort: string
    headline: string
    intro: string
    focusLine: string
  }
  links: {
    github: string
    linkedin: string
    email: string
    bookstagram: string
    bookstagramHandle: string
    jobPosting: string
    source: string
  }
  now: Card[]
  stack: { tagline: string; tags: Array<{ name: string; color: string }> }
  howIWork: Card[]
  languages: Array<{ name: string; level: string }>
  career: Role[]
  education: { degree: string; school: string; start: string; end: string; note: string }
  offClock: { leadLine: string; items: Card[] }
  contact: { freelanceLine: string }
  blocks: BlockMeta[] // default order
}
