from typing import List, Tuple
from opentelemetry.trace import Tracer

def GroupPara(paragraphs: List, minCount: int = 50, tracer: Tracer=None) -> Tuple[List, List[str]]:
    """
    Groups paragraphs into clusters based on their similarity.

    Args:
        paragraphs (List): List of paragraph strings.
        minCount (int): Minimum number of words in paragraphs required to form a group.
        tracer (Tracer): The tracer for request tracking.

    Returns:
        List: A list of grouped paragraphs.
    """
    paras = list(paragraphs)
    grouped = []
    current_paras = []
    para = []
    words = 0
    
    while paras:
        base_para = paras.pop(0)
        base_words = base_para[4].split()
        words += len(base_words)
        current_paras.append(base_para)
        
        if words >= minCount:
            grouped.append(current_paras)
            para.append("")
            for p in current_paras:
                para[-1] += (p[4])
            current_paras = []
            words = 0
            
    print("Grouped Paragraphs:", len(para))
    print("Number of Groups:", len(grouped))
    return grouped, para
