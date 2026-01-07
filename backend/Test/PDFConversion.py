import os
import unittest
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Utils.File import xml_to_pdf_with_underlines

class TestXMLToPDF(unittest.TestCase):
    def setUp(self):
        self.xml_file = "./Test/Data/XMLtest.xml"
        self.pdf_file = "./Test/Data/S4_underlined.pdf"

        # Remove old PDF if exists
        if os.path.exists(self.pdf_file):
            os.remove(self.pdf_file)

    def test_pdf_creation(self):
        """Check that PDF is created from XML."""
        xml_to_pdf_with_underlines(self.xml_file, self.pdf_file)
        self.assertTrue(os.path.exists(self.pdf_file), "PDF file was not created")

    def test_pdf_not_empty(self):
        """Check that generated PDF is not empty."""
        xml_to_pdf_with_underlines(self.xml_file, self.pdf_file)
        file_size = os.path.getsize(self.pdf_file)
        self.assertGreater(file_size, 0, "PDF file is empty")

    def tearDown(self):
        pass
        # Optional cleanup
        # if os.path.exists(self.pdf_file):
        #     os.remove(self.pdf_file)


if __name__ == "__main__":
    unittest.main()