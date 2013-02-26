from scrapy.spider import BaseSpider
from scrapy.selector import HtmlXPathSelector
from cdlm.items import DmozItem
from scrapy.http import Request
import time
import codecs
import random
import pprint

# launch with
# scrapy crawl dmoz

# test by > scrapy shell http://stafdslkmfqds.com

class DmozSpider(BaseSpider):
	name = "dmoz"
	allowed_domains = ["croisedanslemetro.com"]
	start_urls = [
		"http://paris.croisedanslemetro.com/page/1/"
	]
	
	def parse_subpage(self, response):
		hxs = HtmlXPathSelector(response)
		item = response.meta['item']
		anndate = hxs.select('//*[@id="annonce-meta"]/ul[1]/li[2]/text()').extract()[0]
		annpublished = hxs.select('//*[@id="annonce-meta"]/ul[1]/li[4]/span/text()').extract()[0]
		annlikes = hxs.select('//*[@id="favoris"]/text()').extract()[0]
		title = hxs.select('//div[@id="annonce-body"]/h1/text()').extract()[0]
		contents = hxs.select('//div[@id="annonce-body"]/p/text()').extract()
		item['annlikes'] = annlikes
		item['anndate'] = anndate
		item['annpublished'] = annpublished
		item['txttitle'] = title
		item['txtcontent'] = "#".join(contents)
		item['txtlength'] = len(item['txtcontent'])
		item['txtnmots'] = len(item['txtcontent'].split(' '))
		#pprint.pprint(item,indent=4)
		print "PARSED:"+item['date']
		return item
		
	def parse(self, response):
		hxs = HtmlXPathSelector(response)
		
		items_or_requests = []
		
		# do it again on next link
		nexthref = hxs.select('//div[@id="pagination"]/a[@title="Page suivante"]/@href')[0].extract()
			
		dates = hxs.select('//div[@class="ad-date"]')
		lists = hxs.select('//ul[@class="adslist"]')
		for k,date in enumerate(dates):
			curDate = date.select('h3/text()').extract()
			mess = lists[k].select('li[@class="adsitem"]')
			for elem in mess:
				item = DmozItem()
				item['linknextpage']=nexthref
				item['date']=curDate[0]
				item['ligne']=elem.select('div[@class="location"]/a/@href').extract()[1].split('/')[2]
				pom = elem.select('div[@class="ad-soul"]/cite[@class="info"]/a/@href').extract()
				item['station']=pom[1].split("/")[2]
				item['stationfull']=elem.select('div[@class="ad-soul"]/cite[@class="info"]/a[@class="station"]/text()').extract()[0]
				item['whofrom']=pom[0].split('/')[2]
				item['whoto']=pom[0].split('/')[4]
				item['linkmsg']=elem.select('div[@class="ad-soul"]/strong[@class="title"]/a/@href').extract()[0]
				
				#items_or_requests.append(item) item is stored in subpage request !
				
				subpage_url = "http://paris.croisedanslemetro.com"+item['linkmsg']
				# wait between each annonce
				time.sleep(random.random())
				
				request = Request(subpage_url,callback=self.parse_subpage)
				request.meta['item'] = item
				items_or_requests.append(request)
		
		newpage_url = "http://paris.croisedanslemetro.com"+item['linknextpage']
		request = Request(newpage_url,callback=self.parse)
		items_or_requests.append(request)
		# wait between each page
		time.sleep(random.random()*5.5)
		return items_or_requests



