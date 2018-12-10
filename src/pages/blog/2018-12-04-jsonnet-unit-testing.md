---
templateKey: blog-post
title: KSonnet: Unit testing KSonnet components 
date: 2018-12-09T18:54:13.868Z
description: A quick look t unit testing KSonnet components
tags:
  - ksonnet
  - jsonnet
  - kubernetes
  - testing
---

## Why test KSonnet components?
Whenever we develop code, we want to write tests to make it easy to refactor components, add new modules, and remove old ones. It is important that we verify that we are able to give the same input, and get the same output. We do not want to break more than we fix!

One of the main advantages of the Ksonnet and JSonnet language is that it allows us to develop an API and abstractions for generating our Kubernetes manifests. 

I feel that testing KSonnet components is especially important. By declaring the behaviour we expect out of a ksonnet component, we make refactoring our code much simpler. Otherwise we find ourselves eyeballing a large amount of YAML files, and nobody got time for that.

## How do we implement unit testing in KSonnet?

First, we create a directory in your `ksonnet` environment root: `tests`.

Next, we add `(component_name)_test.libsonnet` files as we develop new components.

Tests are `libsonnet` files. We write our ksonnet components as functions and provide an API for creating them.

In order to properly test Ksonnet components, we must write our components with the assumption that we do not have access to the global Ksonnet variables `env` and `params`, and instead assume those will be passed into functions we declare.

To declare the output we want from our Ksonnet components we use the `std.assertEqual` standard library functions. We `&&` these assertions together to ensure they are all evaluated.

Finally, we make sure to output our component instance and test suite results. Otherwise the compiler will notice that these variables are not used, and will not bother to evaluate them.

Example component and test. `k.libsonnet` and the ksonnet `components` directory must be in our jsonnet path.

```
# components/example.libsonnet
// Import KSonnet library
local k = import "k.libsonnet";

// Specify the import objects that we need
local container = k.extensions.v1beta1.deployment.mixin.spec.template.spec.containersType;
local depl = k.extensions.v1beta1.deployment;

// Define containers

    
local new(_env, _params) = (
local params = _env + _params.components.example;
  local containers = [
        container.new(params.name, params.image)
  ];

  local deployment = 
      depl.new(params.name, params.replicas, containers, {app: params.name}); 
);
    

# tests/example_test.libsonnet
local componentToTest = import "./example.libsonnet";
local name = "example_name";
local image = "example_image";
local replicas = 3;
local instance = componentToTest.new({}, parmas);

local params = {
  components: {
    example: {
      name: name,
      image: image,
      replicas: replicas
    }
  }
};

local runTests(params) = (
  local testResults = 
    // Check to ensure deployment name matches up
    std.assertEqual(instance.spec.metadata.name, name) &&
    // Check to ensure container image matches up
    std.assertEqual(instance.spec.template.spec.containers[0].image, image) &&
    //Check to ensure container name matches up.
    std.assertEqual(instance.spec.template.spec.containers[0].name, name);
  testResults
);


{
  output: instance,
  results: runTests(params),
}
```

## Running our tests

Our test runner is very lazy. It is a python script. It uses a python library called `invoke`. Invoke is an api for doing shell-things with python, similar to `fabric`.

We give our test suite access to the jsonnet files available on `components` by passing the flag `--jpath ./components` to our call to `jsonnet`.

Test runner code here:

```
#! python
from invoke import task
from glob import glob
import os
import json


@task
def test(c):
    print("Running jsonnet tests: ")
    test_results = []
    for root, sub_folders, files in os.walk("./tests"):
        for file in files:
            path = os.path.join(root, file)
            result = c.run("jsonnet --jpath ./components " + path, hide='both', warn='True')
            if result.ok:
                print('.')
                test_results.append(True)
            else:
                print(result.stderr)
                test_results.append(False)

    print_test_results(test_results)

def print_test_results(test_results):
    tests_successful = str(len([i for i in test_results if i]))
    tests_failed = str(len([i for i in test_results if not i]))
    print("Successful: " + tests_successful + " Failed: " + tests_failed + " Total : " + str(len(test_results)))


@task
def fmt(c):
    print("Formatting...")
    format_files(c, "./tests")
    format_files(c, "./components")
    print("Done.")


def format_files(c, files_path):
    for root, sub_folders, files in os.walk(files_path):
        for file in files:
            path = os.path.join(root, file)
            result = c.run("jsonnet fmt " + path, hide='stdout').stdout
            with open(path, "w+") as f:
                f.write(result)
```
