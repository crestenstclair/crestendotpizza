---
templateKey: blog-post
title: 'Elixir: Using a with statement to control a pipeline.'
date: 2018-12-04T18:54:13.868Z
description: A quick look and example using Elixir's `with` statement.
tags:
  - elixir
  - programming
  - elixirlang
  - syntax
  - pipelines
---
I was watching an elixirconf talk the other day about pipelines and how to handle long pipelines and I found some really interesting / useful code!


I typed up this module to demonstrate:

```
defmodule Brunch do
  def make_bloody_mary(missing_ingredient) do
    IO.inspect("Making Brunch:")
    IO.inspect("________")

    with :ok <- add_tomato_juice(missing_ingredient),
         :ok <- add_tobasco_sauce(missing_ingredient),
         :ok <- add_celery_salt(missing_ingredient),
         :ok <- add_horseradish(missing_ingredient),
         :ok <- add_vodka(missing_ingredient) do
      success_step(:ok)
    else
      {:error, :out_of_vodka} -> add_whisky(:ok) |> success_step()
      {:error, message} -> error_step(message)
      _ -> unknown_step()
    end
  end

  def add_tomato_juice(_) do
    IO.inspect("Adding tomato juice")
    :ok
  end

  def add_tobasco_sauce(_) do
    IO.inspect("Adding tobasco sauce")
    :ok
  end

  def add_horseradish(:horseradish) do
    IO.inspect("Adding horseradish")
    {:error, "You forgot to pick up horseradish!!"}
  end

  def add_horseradish(_) do
    IO.inspect("Adding horseradish")
    :ok
  end

  def add_celery_salt(_) do
    IO.inspect("Adding celery salt")
    :ok
  end

  def add_vodka(:vodka) do
    IO.inspect("Adding vodka.")
    IO.inspect("Oh no! You forgot to pick up vodka!")
    {:error, :out_of_vodka}
  end

  def add_vodka(_) do
    IO.inspect("Adding vodka.")
    :ok
  end

  def add_whisky(_) do
    IO.inspect("No matter, we can use whisky instead.")
    :ok
  end

  def success_step(_) do
    IO.inspect("You did it! Have a great brunch!")
    IO.inspect("")
    IO.inspect("")
  end

  def error_step(message) do
    IO.inspect("You have ruined brunch, for reason: " <> message)
    IO.inspect("")
    IO.inspect("")
  end

  def unknown_step() do
    IO.inspect("How did this even happen?!?")
  end
end

IO.inspect(
  "When we run this, things did not go as planned. However, we CAN recover from this. So we match on :out_of_vodka in our else block, and add whisky instead."
)

IO.inspect("Whisky is better in a bloody mary anyway")
Brunch.make_bloody_mary(:vodka)

IO.inspect(
  "When we run this, we have hit an unrecoverable error, so we handle the error in our else block."
)

Brunch.make_bloody_mary(:horseradish)

IO.inspect(
  "When we run this, the pipeline goes as expected, and we can enjoy our brunch in peace."
)

Brunch.make_bloody_mary(:all_good)
```

The output looks like this:

```
"When we run this, things did not go as planned. However, we CAN recover from this. So we match on :out_of_vodka in our else block, and add whisky instead."
"Whisky is better in a bloody mary anyway"
"Making Brunch:"
"________"
"Adding tomato juice"
"Adding tobasco sauce"
"Adding celery salt"
"Adding horseradish"
"Adding vodka."
"Oh no! You forgot to pick up vodka!"
"No matter, we can use whisky instead."
"You did it! Have a great brunch!"
""
""
"When we run this, we have hit an unrecoverable error, so we handle the error in our else block."
"Making Brunch:"
"________"
"Adding tomato juice"
"Adding tobasco sauce"
"Adding celery salt"
"Adding horseradish"
"You have ruined brunch, for reason: You forgot to pick up horseradish!!"
""
""
"When we run this, the pipeline goes as expected, and we can enjoy our brunch in peace."
"Making Brunch:"
"________"
"Adding tomato juice"
"Adding tobasco sauce"
"Adding celery salt"
"Adding horseradish"
"Adding vodka."
"You did it! Have a great brunch!"
""
""
```
