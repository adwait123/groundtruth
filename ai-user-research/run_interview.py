import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def run_interview():
    # API endpoint
    BASE_URL = "http://localhost:8000/api"

    print("\n=== AI-Powered User Research Platform ===\n")

    # Get project info
    project_name = input("What is your project name? ")
    print("\nProject Goals:")
    print("1. Discovery (Understanding user problems and needs)")
    print("2. Improvement (Validating existing solution)")
    goal_choice = input("Select your project goal (1/2): ")
    goal = "Discovery" if goal_choice == "1" else "Improvement"
    target_audience = input("\nDescribe your target audience: ")

    try:
        # Start project
        response = requests.post(f"{BASE_URL}/start-project", json={
            "project_name": project_name,
            "goal": goal,
            "target_audience": target_audience
        })
        response.raise_for_status()
        data = response.json()
        session_id = data["session_id"]
        current_question = data["question"]

        # Interview loop
        while True:
            print(f"\nQ: {current_question}")
            user_response = input("Response (or 'exit' to finish): ")

            if user_response.lower() == 'exit':
                break

            # Submit response
            response = requests.post(
                f"{BASE_URL}/submit-response/{session_id}",
                json={"response": user_response}
            )
            response.raise_for_status()
            data = response.json()

            current_question = data["question"]
            if data.get("can_finish"):
                if input("\nWould you like to continue? (y/n): ").lower() != 'y':
                    break

        # Get analysis
        print("\nAnalyzing responses...")
        response = requests.post(f"{BASE_URL}/analyze/{session_id}")
        response.raise_for_status()
        analysis = response.json()

        print("\nAnalysis Results:")
        print(analysis["analysis"])

    except requests.exceptions.RequestException as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    run_interview()