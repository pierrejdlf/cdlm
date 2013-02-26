#import nltk
#import csv
import networkx

import codecs

######################################################################
def domyjobplease():
	print "job starting"
	
	g=networkx.DiGraph()
	
	lens=[2541,79257,186436,22520]
	######################################## parse csv
	for ityp,typ in enumerate(["ff","fh","hf","hh"]):
		g.add_node(typ,{'cat':'type','weight':10})
	 	inFile = codecs.open('./mots/'+typ+'.csv', 'r','utf-8')
	 	#reader = csv.reader(inFile, delimiter=',')
	 	rownum = 0
	 	for row in inFile.readlines():#reader:
		 	if rownum == 0:
		 		header = row
		 	else:
		 		r=row.split(",")
		 		w = r[0]
		 		tn = int(r[1])
		 		tf = tn*10000/float(lens[ityp])
				g.add_node(w,{'cat':'gram','weight':1})
				g.add_edge(w,typ,{'weight':tf})
		 	rownum += 1
		inFile.close()	
	
	outFilePath = './mots/mots_hffh.gexf'
	networkx.readwrite.gexf.write_gexf(g,outFilePath,encoding='utf-8')
	
	######################################## do nltk job
	#mysentence=u"A sentence to be tokenized"
	#print nltk.word_tokenize(mysentence)
	
	print "job done"
######################################################################
domyjobplease()