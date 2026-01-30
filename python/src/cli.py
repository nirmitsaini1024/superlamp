from agent import get_agent
from langfuse.langchain.CallbackHandler import LangchainCallbackHandler
import uuid

_callback_handler = LangchainCallbackHandler()

def main():
    agent_executor = get_agent()
    langfuse_session_id = str(uuid.uuid4())
    thread_id = str(uuid.uuid4())
    while True:
        question = input(">>> ")
        if question == "/q":
            break
        for step in agent_executor.stream(
            {"messages": [("user", question)]},
            config={
                "callbacks": [_callback_handler],
                "configurable": {
                    "thread_id": thread_id,
                },
                "metadata": {
                    "thread_id": thread_id,
                    "langfuse_tags": ["VULTR_CHATBOT"],
                    "lanfuse_session_id": langfuse_session_id,
                },
            },
            stream_mode="values",
        ):
            step["messages"][-1].pretty_print()

if __name__ == "__main__":
    main()