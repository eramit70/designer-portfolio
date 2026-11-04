"""Verify animation states, accessibility escape hatches, and dynamic galleries."""
import os
from playwright.sync_api import sync_playwright
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8000/')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'index.html');page.wait_for_selector('.motion-toggle')
 assert page.locator('#hero-title .word').count()>0
 assert page.locator('#hero-title').get_attribute('aria-label')=='Spaces that feel like you.'
 assert page.locator('.ribbon-track').count()==2
 assert page.evaluate("document.getAnimations().some(a=>a.animationName==='design-ticker')")
 page.locator('#hero-next').click();assert 'Every detail' in page.locator('#hero-title').inner_text()
 page.locator('#hero-prev').click()
 page.wait_for_timeout(1300);page.screenshot(path='/tmp/forme-animated-desktop.png')
 page.evaluate('scrollTo(0,850)');page.wait_for_timeout(1300)
 assert page.evaluate("parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-travel'))>0")
 assert page.locator('.image-reveal.is-visible').count()>0
 assert page.evaluate("getComputedStyle(document.querySelector('.reading-progress')).transform!=='matrix(0, 0, 0, 1, 0, 0)'")
 page.get_by_role('button',name='Pause decorative animations',exact=True).click()
 assert page.locator('html').evaluate("el=>el.classList.contains('motion-paused')")
 assert not page.evaluate("document.getAnimations().some(a=>a.playState==='running')")
 page.reload();page.wait_for_selector('.motion-toggle');assert page.locator('html').evaluate("el=>el.classList.contains('motion-paused')")
 page.get_by_role('button',name='Enable decorative animations',exact=True).click()
 assert not page.locator('html').evaluate("el=>el.classList.contains('motion-paused')")
 print('PASS heading animation, ticker, hero slide, parallax, image reveal, scroll progress and persisted motion switch')
 page.goto(base+'portfolio.html');page.wait_for_selector('#project-grid .motion-enter')
 page.get_by_role('button',name='Kitchen',exact=True).click();page.wait_for_selector('#project-grid .motion-enter.is-visible');assert page.locator('#project-grid .card').count()==1
 page.locator('#search').fill('no-result');assert page.locator('#clear-filters').is_visible()
 print('PASS dynamically filtered cards animate and empty results remain usable')
 page.set_viewport_size({'width':390,'height':844});page.goto(base+'index.html');page.wait_for_selector('.motion-toggle');page.wait_for_timeout(1400)
 assert page.locator('body').evaluate('(el)=>el.scrollWidth<=innerWidth')
 page.locator('.menu-button').click();page.wait_for_timeout(600);assert page.locator('#navigation').is_visible();page.keyboard.press('Escape')
 page.screenshot(path='/tmp/forme-animated-mobile.png')
 page.emulate_media(reduced_motion='reduce');page.wait_for_function("document.documentElement.classList.contains('motion-paused')")
 assert page.locator('.motion-toggle').is_disabled()
 assert not page.evaluate("document.getAnimations().some(a=>a.playState==='running')")
 assert page.locator('#hero-title .word').first.evaluate("e=>getComputedStyle(e).opacity==='1'")
 page.emulate_media(reduced_motion='no-preference');page.wait_for_function("!document.documentElement.classList.contains('motion-paused')")
 assert not errors,errors
 print('PASS mobile menu, no overflow, live reduced motion, restored preference and zero JavaScript errors')
 b.close()
