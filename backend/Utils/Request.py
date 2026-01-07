import httpx
from opentelemetry.trace import Tracer

async def GetClass(token: str) -> int:
    """
    Determines the class of the given characters based on predefined categories.

    Args:
        chars (str): The input string to classify.
        tracer (Tracer, optional): The tracer for request tracking.

    Returns:
        str: The class of the input string.
    """
    url = "http://localhost:3344/api/get"
    payload = {"chars": token}
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            return data.get("result", 4), data.get("model_class", -1)
        else:
            return 4, -1
    
    
