"""Browser integration tests using synthetic fixtures; never publish fixture data."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 site=json.loads((root/'data/site.json').read_text());site['whatsapp']='919999999999';site['stats']=[{'verified':True,'value':7,'label':'Synthetic test statistic'}]
 projects=json.loads((root/'data/projects.json').read_text());projects[0]['comparison']={'verified':True,'before':'assets/images/living.svg','after':'assets/images/bedroom.svg','beforeAlt':'Synthetic before fixture','afterAlt':'Synthetic after fixture'};projects[0]['images'].append({'src':'assets/images/bedroom.svg','alt':'Second test fixture image'})
 page.route('**/data/site.json',lambda route:route.fulfill(json=site))
 page.route('**/data/projects.json',lambda route:route.fulfill(json=projects))
 page.route('**/data/testimonials.json',lambda route:route.fulfill(json=[{'verified':True,'name':'Synthetic fixture A','quote':'First test quote'},{'verified':True,'name':'Synthetic fixture B','quote':'Second test quote'}]))
 page.goto(base+'before-after.html');slider=page.get_by_role('slider');slider.wait_for();slider.focus();page.keyboard.press('ArrowRight');assert slider.input_value()=='51';assert '49%' in slider.get_attribute('aria-valuetext')
 box=slider.bounding_box();page.mouse.click(box['x']+box['width']*.75,box['y']+box['height']/2);assert int(slider.input_value())>60
 page.touchscreen.tap(box['x']+box['width']*.25,box['y']+box['height']/2);assert int(slider.input_value())<40
 print('PASS comparison keyboard, pointer and touch input with synthetic verified pair')
 page.goto(base+'project.html?slug='+projects[0]['slug']);page.locator('.gallery-image').first.click();page.keyboard.press('ArrowRight');assert '2 / 2' in page.locator('#image-caption').inner_text();page.keyboard.press('ArrowRight');assert '1 / 2' in page.locator('#image-caption').inner_text();page.keyboard.press('Escape')
 page.goto(base+'index.html');page.locator('#quote-next').click();assert 'Second test quote' in page.locator('#quote').inner_text();page.locator('[data-count]').scroll_into_view_if_needed();page.wait_for_function("document.querySelector('[data-count]').textContent==='7'")
 print('PASS multi-image lightbox wrap, testimonial carousel and verified statistic count-up')
 page.goto(base+'appointment.html');page.wait_for_selector('#enquiry');page.locator('button[type=submit]').click();assert not page.locator('#form-status').inner_text()
 for key,value in {'name':'Test & <Visitor>','mobile':'+91 99999 99999','location':'Test location','date':'2027-01-10','requirements':'A synthetic enquiry, not a real appointment.'}.items():page.locator('#'+key).fill(value)
 page.locator('#service').select_option(label='Architecture');page.locator('#type').select_option(label='New home');page.locator('#time').select_option('10:00');page.locator('button[type=submit]').click();a=page.locator('#form-status a');assert a.get_attribute('href').startswith('https://wa.me/919999999999?text=');assert '%26' in a.get_attribute('href');assert 'No appointment' not in page.locator('#form-status').inner_text();assert 'not sent yet' in page.locator('#form-status').inner_text();assert '<Visitor>' in page.locator('#form-status').inner_text()
 print('PASS required fields, configured WhatsApp encoding, safe text and manual confirmation')
 # Simulate the repository subpath, forwarding only test requests to our checkout-only server.
 page.unroute_all(behavior='wait')
 def subpath(route):
  response=route.fetch(url=route.request.url.replace('/designer-portfolio/','/'))
  route.fulfill(response=response)
 page.route('**/designer-portfolio/**',subpath)
 page.goto(base+'designer-portfolio/portfolio.html');page.wait_for_selector('#project-grid .card');page.locator('#project-grid .card').first.click();page.wait_for_selector('.gallery-image');assert '/designer-portfolio/project.html' in page.url
 print('PASS repository-subpath assets, JSON and project links')
 page.unroute_all(behavior='wait');page.route('**/data/projects.json',lambda route:route.fulfill(status=500,body='Unavailable'));page.goto(base+'portfolio.html');page.wait_for_selector('h1');assert 'taking a moment' in page.locator('h1').inner_text()
 print('PASS failed JSON friendly recovery state')
 assert not errors, errors
 browser.close()
