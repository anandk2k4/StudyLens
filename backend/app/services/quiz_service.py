import ollama


def generate_quiz(segments):

    total_segments = len(segments)

    if total_segments < 9:

        important_segments = segments

    else:

        important_segments = (

            segments[:3] +

            segments[
                total_segments // 2:
                total_segments // 2 + 3
            ] +

            segments[-3:]
        )

    context = "\n".join(

        segment["text"]

        for segment in important_segments
    )

    prompt = f"""
Transcript:
{context}

You are an educational AI assistant.

Create EXACTLY 3 multiple choice questions
based ONLY on the story transcript.

Rules:
- Questions must be related to story events
- Questions must be related to characters
- Questions must be related to the moral/lesson
- Do NOT ask questions about formatting
- Do NOT ask questions about instructions
- Do NOT generate explanations
- Do NOT generate code
- Do NOT generate JSON

Each question must contain:
- 1 question
- 4 answer options
- 1 correct answer

Use this exact format:

Q: Question here
A) Option
B) Option
C) Option
D) Option
Answer: A

Q: Question here
A) Option
B) Option
C) Option
D) Option
Answer: B

Generate all 3 questions completely.
"""
    
    response = ollama.chat(

        model="phi",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        options={
            "temperature": 0.1,
            "num_predict": 300
        }
    )

    content = response[
        "message"
    ]["content"]

    return parse_quiz(content)


def parse_quiz(content):

    quizzes = []

    blocks = content.split("Q:")

    for block in blocks:

        block = block.strip()

        if not block:
            continue

        lines = [
            line.strip()
            for line in block.split("\n")
            if line.strip()
        ]

        try:

            question = lines[0]

            options = [
                line[3:]
                for line in lines[1:5]
            ]

            answer_letter = (lines[5].replace("Answer:", "").strip())
            answer_letter = answer_letter[0]
            answer_map = {
                "A": options[0],
                "B": options[1],
                "C": options[2],
                "D": options[3]
            }

            answer = answer_map.get(answer_letter,options[0])

            quizzes.append({
                "question": question,
                "options": options,
                "answer": answer
            })

        except:
            continue

    return quizzes