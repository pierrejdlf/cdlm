# Scrapy settings for cdlm project
#
# For simplicity, this file contains only the most important settings by
# default. All the other settings are documented here:
#
#     http://doc.scrapy.org/topics/settings.html
#

BOT_NAME = 'cdlm'
BOT_VERSION = '1.0'

SPIDER_MODULES = ['cdlm.spiders']
NEWSPIDER_MODULE = 'cdlm.spiders'
USER_AGENT = '%s/%s' % (BOT_NAME, BOT_VERSION)

FEED_FORMAT =  "CSV"
FEED_URI = "output/annonces.csv"