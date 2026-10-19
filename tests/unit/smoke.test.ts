import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.vue'

describe('App', () => {
  it('renders the name as the page heading', () => {
    const wrapper = mount(App)
    expect(wrapper.find('h1').text()).toBe('Konstantina Roumelioti')
  })
})
