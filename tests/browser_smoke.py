from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import os
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get("CHROMIUM_PATH","/usr/bin/chromium"),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for name in ['index','about','services','portfolio','project','before-after','appointment','contact']:
  page.goto(base+name+'.html');page.wait_for_selector('#main h1');assert page.locator('#main h1').inner_text();assert page.locator('body').evaluate('(el)=>el.scrollWidth<=innerWidth'),name
  print('PASS desktop',name)
 page.goto(base+'portfolio.html');page.wait_for_selector('#project-grid .card');assert page.locator('#project-grid .card').count()==6
 page.locator('#load-more').click();assert page.locator('#project-grid .card').count()==8
 page.locator('#room').select_option(label='Bedroom');assert page.locator('#project-grid .card').count()==2;page.locator('#room').select_option('');
 page.locator('#search').fill('no-such-room');assert page.locator('#clear-filters').is_visible();page.locator('#clear-filters').click()
 page.get_by_role('button',name='Kitchen',exact=True).click();assert page.locator('#project-grid .card').count()==1
 page.locator('#project-grid .card').first.click();page.wait_for_selector('.gallery-image');page.locator('.gallery-image').first.click();assert page.locator('dialog').is_visible();page.keyboard.press('ArrowRight');page.keyboard.press('Escape');assert not page.locator('dialog').is_visible()
 print('PASS filters, search, load more, project navigation, lightbox and Escape')
 page.goto(base+'appointment.html');page.wait_for_selector('#enquiry');page.locator('#name').fill('Test Visitor');page.locator('#mobile').fill('+91 99999 99999');page.locator('#service').select_option(label='Architecture');page.locator('#type').select_option(label='New home');page.locator('#location').fill('Test location');page.locator('#date').fill('2027-01-10');page.locator('#time').select_option('10:00');page.locator('#requirements').fill('A test design enquiry with natural materials.');page.locator('button[type=submit]').click();assert 'No enquiry has been sent' in page.locator('#form-status').inner_text();assert page.locator('a[href^="https://wa.me"]').count()==0
 print('PASS enquiry preview and unconfigured WhatsApp safeguard')
 page.goto(base+'project.html?slug=missing');page.wait_for_selector('h1');assert 'find another' in page.locator('h1').inner_text()
 print('PASS invalid slug')
 page.set_viewport_size({'width':390,'height':844})
 for name in ['index','about','services','portfolio','project','before-after','appointment','contact']:
  page.goto(base+name+'.html');page.wait_for_selector('#main h1');assert page.locator('body').evaluate('(el)=>el.scrollWidth<=innerWidth'),name
  print('PASS mobile',name)
 page.goto(base+'index.html');page.wait_for_selector('.hero');page.locator('.menu-button').click();assert page.locator('#navigation').is_visible();page.keyboard.press('Escape');assert not page.locator('#navigation').is_visible()
 page.emulate_media(reduced_motion='reduce');page.wait_for_function("document.querySelector('#hero-pause').getAttribute('aria-label')==='Play slideshow'")
 page.screenshot(path='/tmp/forme-mobile.png',full_page=True)
 page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'index.html');page.wait_for_selector('.hero');page.screenshot(path='/tmp/forme-desktop.png',full_page=False)
 assert not errors,errors
 print('PASS mobile menu, reduced motion, zero uncaught JavaScript errors')
 browser.close()
