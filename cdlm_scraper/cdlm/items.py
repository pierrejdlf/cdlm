# Define here the models for your scraped items
#
# See documentation in:
# http://doc.scrapy.org/topics/items.html

from scrapy.item import Item, Field

class DmozItem(Item):
	date = Field()
	ligne = Field()
	station = Field()
	stationfull = Field()
	whofrom = Field()
	whoto = Field()
	linknextpage = Field()
	linkmsg = Field()
	txttitle = Field()
	txtcontent = Field()
	txtlength = Field()
	txtnmots = Field()
	anndate = Field()
	annpublished = Field()
	annlikes = Field()
		
# DateMet
# DatePublished
# 
# Likes
# 
# Line
# Station
# Type
# From
# To
# 
# Title
# Message