import ast
import os

def parse_imports(file_path):
    with open(file_path, "r") as file:
        tree = ast.parse(file.read(), filename=file_path)
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)
    return imports

def parse_function_calls(file_path):
    with open(file_path, "r") as file:
        tree = ast.parse(file.read(), filename=file_path)
    function_calls = {}
    current_function = None
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            current_function = node.name
            function_calls[current_function] = []
        elif isinstance(node, ast.Call) and current_function:
            if isinstance(node.func, ast.Name):
                function_calls[current_function].append(node.func.id)
            elif isinstance(node.func, ast.Attribute):
                function_calls[current_function].append(node.func.attr)
    return function_calls

def analyze_project(folder_path):
    relationships = {}
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                module_name = os.path.splitext(os.path.relpath(file_path, folder_path))[0].replace(os.sep, ".")
                imports = parse_imports(file_path)
                function_calls = parse_function_calls(file_path)
                relationships[module_name] = {
                    "imports": imports,
                    "function_calls": function_calls
                }
    return relationships

def display_relationships(relationships):
    for module, details in relationships.items():
        print(f"Module: {module}")
        print("  Imports:")
        for imp in details["imports"]:
            print(f"    - {imp}")
        print("  Function Calls:")
        for func, calls in details["function_calls"].items():
            print(f"    Function {func} calls:")
            for call in calls:
                print(f"      - {call}")
        print()

# Define the project folder
project_folder = "opendevin"

# Analyze the project and display relationships
relationships = analyze_project(project_folder)
display_relationships(relationships)
