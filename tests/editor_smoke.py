"""Exercise local workspace editing, separate studios, previews and portable exports."""
import os,json,zipfile,io
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8000/')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:d.accept())
 page.goto(base+'admin/index.html');page.get_by_role('heading',name='A clear view of your content.').wait_for()
 page.get_by_role('button',name='Studio & website',exact=True).click();page.locator('#field-site-name').fill('Edited Studio')
 page.get_by_role('button',name='Save browser draft',exact=True).click();assert 'saved in this browser only' in page.locator('#notice').inner_text()
 page.get_by_role('button',name='Preview & export',exact=True).click();frame=page.frame_locator('#preview-frame');frame.get_by_role('link',name='Edited Studio home').first.wait_for()
 assert 'FORME' not in frame.locator('#header .brand-name').inner_text()
 with page.expect_download() as info:page.get_by_role('button',name='Download workspace JSON',exact=True).click()
 workspace=json.loads(Path(info.value.path()).read_text());assert workspace['studios']['forme']['site']['name']=='Edited Studio'
 print('PASS structured site edit, browser draft and unsaved live preview')
 page.get_by_role('button',name='+ Add a studio',exact=True).click();page.locator('#new-id').fill('oak-studio');page.locator('#new-label').fill('Oak Studio');page.locator('#new-url').fill('https://oak.example/');page.get_by_role('button',name='Create studio',exact=True).click();page.locator('#field-site-name').wait_for();assert page.locator('#studio-select').input_value()=='oak-studio'
 page.locator('#field-site-name').fill('Oak Independent');page.get_by_role('button',name='URLs & file paths',exact=True).click();page.locator('#field-routing-admin-contactEmail').fill('owner@example.com')
 page.get_by_role('button',name='Preview & export',exact=True).click();frame=page.frame_locator('#preview-frame');frame.get_by_role('link',name='Oak Independent home').first.wait_for()
 frame.get_by_role('link',name='Portfolio',exact=True).click();frame.locator('#project-grid .card').first.wait_for();assert 'editorPreview=1' in page.locator('#preview-frame').evaluate('(el)=>el.contentWindow.location.href')
 with page.expect_download() as info:page.get_by_role('button',name='Download website update ZIP',exact=True).click()
 with zipfile.ZipFile(info.value.path()) as archive:
  assert archive.testzip() is None
  config=json.loads(archive.read('data/config.json'));assert len(config['studios'])==2
  assert config['studios'][1]['admin']['contactEmail']=='owner@example.com'
  assert json.loads(archive.read('data/site.json'))['name']=='Edited Studio'
  assert json.loads(archive.read('data/studios/oak-studio/site.json'))['name']=='Oak Independent'
  assert 'password' not in archive.read('data/config.json').decode()
 print('PASS separate studio content, URL/contact configuration, preview navigation and valid ZIP export')
 page.locator('#studio-select').select_option('forme');page.get_by_role('button',name='Projects & galleries',exact=True).click()
 # Add and remove a gallery project without touching other studios.
 old=page.locator('[data-remove][data-path="[]"]').count();page.locator('[data-add][data-path="[]"]').click();assert page.locator('[data-remove][data-path="[]"]').count()==old+1
 page.locator('[data-remove][data-path="[]"]').last.click();assert page.locator('[data-remove][data-path="[]"]').count()==old
 page.get_by_role('button',name='Studio & website',exact=True).click();
 with page.expect_file_chooser() as chooser:page.locator('[data-upload][data-path=\'["logo"]\']').click()
 root=Path(__file__).resolve().parents[1];chooser.value.set_files(root/'assets/images/living-concept-768.webp')
 page.get_by_role('status').filter(has_text='Image added').wait_for()
 page.get_by_role('button',name='Preview & export',exact=True).click();frame=page.frame_locator('#preview-frame');frame.locator('.brand-logo').first.wait_for();assert frame.locator('.brand-logo').first.get_attribute('src').startswith('blob:')
 with page.expect_download() as info:page.get_by_role('button',name='Download website update ZIP',exact=True).click()
 with zipfile.ZipFile(info.value.path()) as archive:
  files=[n for n in archive.namelist() if n.startswith('assets/images/uploads/')];assert len(files)==1
  assert archive.read(files[0])==(root/'assets/images/living-concept-768.webp').read_bytes()
 print('PASS collection add/remove, image selection, blob preview and image-byte-preserving export')
 page.get_by_role('button',name='Overview',exact=True).click();page.get_by_role('button',name='Import workspace JSON',exact=True).click()
 bad=workspace.copy();bad['config']=json.loads(json.dumps(workspace['config']));bad['config']['studios'][0]['admin']['password']='not-a-real-credential'
 page.locator('#import-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(bad).encode()});page.get_by_role('status').filter(has_text='Import rejected').wait_for()
 assert page.locator('#studio-select option').count()==2
 page.get_by_role('button',name='Import workspace JSON',exact=True).click();page.locator('#import-file').set_input_files({'name':'workspace.json','mimeType':'application/json','buffer':json.dumps(workspace).encode()});page.get_by_role('status').filter(has_text='Import complete').wait_for();assert page.locator('#studio-select option').count()==1
 print('PASS invalid import rejected atomically and valid workspace round-trip')
 page.set_viewport_size({'width':390,'height':844})
 for section in ['site','services','projects','testimonials','routing','publish','overview']:
  page.locator(f'[data-tab="{section}"]').click()
  page.locator('details').evaluate_all('(nodes)=>nodes.forEach(el=>el.open=true)')
  assert page.locator('body').evaluate('(el)=>el.scrollWidth<=innerWidth'),section
 page.evaluate('scrollTo(0,0)');page.screenshot(path='/tmp/studio-editor-mobile.png',full_page=True)
 page.set_viewport_size({'width':1440,'height':1000});page.evaluate('scrollTo(0,0)');page.screenshot(path='/tmp/studio-editor-desktop.png')
 # Exercise the public loader at a simulated production domain, not only the pure router.
 config=json.loads(json.dumps(workspace['config']))
 other=json.loads(json.dumps(config['studios'][0]));other['id']='oak-domain';other['label']='Domain studio';other['urls']=['https://oak.example/interiors/'];other['content']={kind:f'data/studios/oak-domain/{kind}.json' for kind in ['site','services','projects','testimonials']};config['studios'].append(other)
 content=json.loads(json.dumps(workspace['studios']['forme']));content['site']['name']='Domain Selected Studio'
 domain=b.new_page();domain.on('pageerror',lambda e:errors.append(str(e)))
 def hosted(route):
  from urllib.parse import urlsplit
  path=urlsplit(route.request.url).path.removeprefix('/interiors/')
  if path=='data/config.json':route.fulfill(json=config)
  elif path.startswith('data/studios/oak-domain/'):
   kind=path.rsplit('/',1)[-1].removesuffix('.json');route.fulfill(json=content[kind])
  else:route.fulfill(response=route.fetch(url=base+path))
 domain.route('https://oak.example/**',hosted)
 domain.goto('https://oak.example/interiors/index.html?studio=forme')
 domain.get_by_role('link',name='Domain Selected Studio home').first.wait_for()
 assert 'Domain Selected Studio' in domain.title()
 domain.set_viewport_size({'width':390,'height':844});assert domain.locator('body').evaluate('(el)=>el.scrollWidth<=innerWidth')
 assert domain.locator('link[rel=canonical]').get_attribute('href')=='https://oak.example/interiors/index.html'
 domain.close()
 print('PASS production-domain content selection, subpath assets, canonical URL and ignored development override')
 assert not errors,errors
 print('PASS mobile layout and zero uncaught JavaScript errors')
 b.close()
