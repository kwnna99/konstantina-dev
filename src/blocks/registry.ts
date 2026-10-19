import type { Component } from 'vue'
import type { BlockId } from '../content'
import HeroBlock from './HeroBlock.vue'
import NowBlock from './NowBlock.vue'
import StackBlock from './StackBlock.vue'
import HowIWorkBlock from './HowIWorkBlock.vue'
import LanguagesBlock from './LanguagesBlock.vue'
import CareerBlock from './CareerBlock.vue'
import OffTheClockBlock from './OffTheClockBlock.vue'
import ContactBlock from './ContactBlock.vue'

export const blockComponents: Record<BlockId, Component> = {
  hero: HeroBlock,
  now: NowBlock,
  stack: StackBlock,
  how: HowIWorkBlock,
  languages: LanguagesBlock,
  career: CareerBlock,
  offclock: OffTheClockBlock,
  contact: ContactBlock,
}
