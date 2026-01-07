import os
import unittest
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Utils.File import pdf_to_xml

class TestPDFToXML(unittest.TestCase):
    def setUp(self):
        self.input_pdf = "./Test/Data/XMLtest.pdf"
        self.output_xml = "./Test/Data/XMLtest.xml"

        # Clean up previous runs if any
        if os.path.exists(self.output_xml):
            os.remove(self.output_xml)

    def test_conversion_creates_file(self):
        """Check that pdf_to_xml() successfully creates an XML file."""
        pdf_to_xml(self.input_pdf, self.output_xml)
        self.assertTrue(os.path.exists(self.output_xml), "XML file was not created")

    def test_xml_not_empty(self):
        """Check that the generated XML file is not empty."""
        pdf_to_xml(self.input_pdf, self.output_xml)
        file_size = os.path.getsize(self.output_xml)
        self.assertGreater(file_size, 0, "XML file is empty")

    def tearDown(self):
        # # Optional: remove the XML after testing
        # if os.path.exists(self.output_xml):
        #     os.remove(self.output_xml)
        pass

if __name__ == "__main__":
    unittest.main()