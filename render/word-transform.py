import sys
from docx import Document
from win32com import client
import os

#将doc转化为docx
def doc_docx(fn):
    doc=word.Documents.Open(fn)
    doc.SaveAs("{}x".format(fn),16);
    doc.Close()
    if os.path.exists(fn):
        os.remove(fn)

    return 

if __name__ == "__main__":
    word=client.Dispatch("Word.Application")
    for i in range(1,len(sys.argv)):
        doc_docx(sys.argv[i])
    word.Quit()
        