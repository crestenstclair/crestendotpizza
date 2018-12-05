---
templateKey: blog-post
title: '[WIP] Elixir Testing Arcana REVEALED'
date: 2018-12-05T01:41:46.651Z
description: 'This is a WIP outline, should be unpublished soon'
tags:
  - draft
---

# Table of Contents

1.  [Elixir Testing Arcana REVEALED](#orgb28e07b)
    1.  [The Good](#orgde61395)
        1.  [Mature Ecosystem:](#org006973b)
        2.  [Define homeostasis](#org5bd4731)
        3.  [Language Features](#org326c59f)
        4.  [Easy to learn, amazing resources.](#org9b95ee5)
    2.  [Beware Felix's Magic Bag!](#org135c40b)
        1.  [a cute way of referring to a data structure that holds too much information and gets passed around to too many places.](#org5330e91)
        2.  [Compare to a God Object in an object oriented languages.](#org04374b4)
        3.  [Elixir should be broken up into small modules](#org527a706)
        4.  [Phoenix framework code should be VERY FAR AWAY FROM DOMAIN LOGIC CODE](#org9afbbda)
        5.  [Phoenix: Handles connection, request, and response logic](#orge291ef1)
        6.  [Domain code: Handles domain logic.](#org6dcba39)
        7.  [Phoenix should call into domain code, do not scramble them up!](#org6f2f37f)
        8.  [Umbrella applications are great for this.](#org401c670)
        9.  [define Phoenix.Plug (https://hexdocs.pm/phoenix/plug.html)](#orgfb651f6)
        10. [Plug is a great way to modify an your conn and control your request pipeline](#org755dd72)
        11. [We end up over using this plug module, packing the \`conn\` full to the gills with data.](#orgc17928b)
        12. [Conn becomes infested with domain logic](#org6a0ff54)
        13. [Eventually we find ourselves constantly reaching into Felix's Magic Bag to pull whatever we need out of the \`conn\`](#orgabe36b8)
        14. [Have to engineer conn homeostasis in our top level tests, harder to document.](#orgbda4eac)
        15. [Counter to how frameworks often work, thus: Arcana.](#org1304d39)
    3.  [Mocking using Mox / The (New) Facade Pattern](#orgd195ed4)
        1.  [Define facade pattern](#org298482d)
        2.  [Needs specific knowledge of facade pattern, will not emerge from the code holistically. Thus: Arcana.](#org0e27fdd)
        3.  [http://blog.plataformatec.com.br/2015/10/mocks-and-explicit-contracts/](#org385914a)
        4.  [https://www.youtube.com/watch?v=Ue&#x2013;hvFzr0o&list=PLqj39LCvnOWaxI87jVkxSdtjG8tlhl7U6&index=8](#orga16df89)
        5.  [https://github.com/plataformatec/mox](#orgb000de7)
        6.  [Pros:](#orga9b9fb1)
        7.  [Cons:](#org33a2c4c)
    4.  [Mocking using a "fake" server process](#org5b2583b)
        1.  [Alternative to facade pattern](#orgeb2379c)
        2.  [https://github.com/thoughtbot/bamboo as an example](#orgf83d8df)
        3.  [starts up "fake" server process](#org034da69)
        4.  ["fake" server process hard coded to respond with data specific to current test](#org990b206)
        5.  [Can match on "test" header to control server response](#org5062b95)
        6.  [Provide example: https://github.com/thoughtbot/bamboo/blob/master/test/lib/bamboo/adapters/mandrill\_adapter\_test.exs](#orgc780cc9)
        7.  [Pros](#orgfc75248)
        8.  [Cons](#org27267fe)
    5.  [Testing Running Processes](#orgef53b14)
        1.  [Define elixir processes](#orgfd143b5)
        2.  [A bit of boilerplate](#orgea78305)
        3.  [Not a big deal, but can be avoided easily with some smart coding](#orge42d589)
        4.  [Show example anyway](#org33e466e)
    6.  [TODO: Come up with name for section. Testing OTHER processes!](#orgc6b504c)
        1.  [BAMBOO PROCESS MAILBOX ASSERT<sub>SEND</sub> WEIRDNESS](#orgdf7f85c)
        2.  [Explain: https://github.com/thoughtbot/bamboo/blob/master/lib/bamboo/test.ex](#orgc6c541f)
        3.  [This is very obscure.](#org2f15b3d)
    7.  [Bringing it all together!](#orgbb5e4db)
        1.  [Complex example of facade pattern with Mox complete with tests](#org48a5aed)
        2.  [Running processes](#orgd5c5c56)
        3.  [BrewWatcher](#orgbe43aee)
        4.  [\`fetch ingredients -> put ingredients into pot -> launch brewing process -> start brewing job watcher process  -> Notify on success / failure\`](#orgfd1a0f9)
        5.  [Have to mock a bunch of different APIs](#orgce08843)
        6.  [Architecture graph](#org10e737a)
    8.  [Other fun stuff](#org206b534)
        1.  [Testing Ecto](#org41ff969)
        2.  [Async / Sync tests, implications of](#orge63cb38)
        3.  [Generating test data](#orgb13abd7)


<a id="orgb28e07b"></a>

# Elixir Testing Arcana REVEALED

-   Cheesy intro "GREEEEETINGS fellow alchemist!"
-   Define arcana: Gotchas you actually have to study and read to discover. Contrast with python's goals of one canonical way to do everything.
-   But there is some arcana we should know before starting down the path of an alchemist.


<a id="orgde61395"></a>

## The Good


<a id="org006973b"></a>

### Mature Ecosystem:

1.  ex<sub>unit</sub> - Great standard testing library

2.  propcheck - Awesome property based testing library. Has a great book: <https://pragprog.com/book/fhproper/property-based-testing-with-proper-erlang-and-elixir>

3.  dialyzer - Type checker that works REALLY REALLY WELL

4.  Piggy-backs onto the 30 year old Erlang ecosystem.


<a id="org5bd4731"></a>

### Define homeostasis

1.  The process of building up state to test your application

2.  The balancing act of keeping your software building and running and working


<a id="org326c59f"></a>

### Language Features

1.  Functional language: Immutable! No side effects! No need for homeostasis!

2.  Pattern matching, excellent syntax

3.  Awesome meta-programming, makes understanding how an AST works much simpler. Check it out of you have ever struggled with compiler stuff.


<a id="org9b95ee5"></a>

### Easy to learn, amazing resources.

1.  Literature from PragProg is absolutely great. Books written by the creators of the libraries.

    1.  <https://pragprog.com/book/phoenix14/programming-phoenix-1-4>
    
        1.  Chris McCord - Creator of Phoenix Framework
        
        2.  José Valim - Creator of Elixir
        
        3.  Bruce Tate - Accomplished technical writer
    
    2.  Functional Web Development With Elixir OTP and Phoenix
    
        1.  Excellent "Next Step" after "Programming Elixir" and "Programming Phoenix"
        
        2.  Lance Halvorsen - Core Elixir team member
    
    3.  Metaprogramming Elixir
    
        1.  Chris McCord - Creator of Phoenix Framework
    
    4.  Programming Elixir
    
        1.  Dave Thomas - founder of Wendy's, Accomplished technical writer, Clean Code author, pragprog.com founder

2.  The Little Elixir and OTP Guidebook

    Great resource for learning Elixir / OTP.


<a id="org135c40b"></a>

## Beware Felix's Magic Bag!


<a id="org5330e91"></a>

### a cute way of referring to a data structure that holds too much information and gets passed around to too many places.


<a id="org04374b4"></a>

### Compare to a God Object in an object oriented languages.


<a id="org527a706"></a>

### Elixir should be broken up into small modules


<a id="org9afbbda"></a>

### Phoenix framework code should be VERY FAR AWAY FROM DOMAIN LOGIC CODE


<a id="orge291ef1"></a>

### Phoenix: Handles connection, request, and response logic


<a id="org6dcba39"></a>

### Domain code: Handles domain logic.


<a id="org6f2f37f"></a>

### Phoenix should call into domain code, do not scramble them up!


<a id="org401c670"></a>

### Umbrella applications are great for this.


<a id="orgfb651f6"></a>

### define Phoenix.Plug (<https://hexdocs.pm/phoenix/plug.html>)


<a id="org755dd72"></a>

### Plug is a great way to modify an your conn and control your request pipeline


<a id="orgc17928b"></a>

### We end up over using this plug module, packing the \`conn\` full to the gills with data.


<a id="org6a0ff54"></a>

### Conn becomes infested with domain logic


<a id="orgabe36b8"></a>

### Eventually we find ourselves constantly reaching into Felix's Magic Bag to pull whatever we need out of the \`conn\`


<a id="orgbda4eac"></a>

### Have to engineer conn homeostasis in our top level tests, harder to document.


<a id="org1304d39"></a>

### Counter to how frameworks often work, thus: Arcana.


<a id="orgd195ed4"></a>

## Mocking using Mox / The (New) Facade Pattern


<a id="org298482d"></a>

### Define facade pattern


<a id="org0e27fdd"></a>

### Needs specific knowledge of facade pattern, will not emerge from the code holistically. Thus: Arcana.


<a id="org385914a"></a>

### <http://blog.plataformatec.com.br/2015/10/mocks-and-explicit-contracts/>


<a id="orga16df89"></a>

### <https://www.youtube.com/watch?v=Ue--hvFzr0o&list=PLqj39LCvnOWaxI87jVkxSdtjG8tlhl7U6&index=8>


<a id="orgb000de7"></a>

### <https://github.com/plataformatec/mox>


<a id="orga9b9fb1"></a>

### Pros:

1.  This pattern rules anyway

2.  decouples module API from implementation, good design

3.  Lets you write "debug" modules and other implementations


<a id="org33a2c4c"></a>

### Cons:

1.  Arcana

2.  Uses a lot of fancy Elixir features

3.  A LOT of ways to achieve this pattern, no canonical way

4.  A number of gotchas

    1.  Distillery deployments
    
    2.  Compile time stuff ( Elixir module properties are compile time )
    
    3.  If you do not use elixir module properties, can create some overhead due to querying ETS table. ( Make sure this is true )


<a id="org5b2583b"></a>

## Mocking using a "fake" server process


<a id="orgeb2379c"></a>

### Alternative to facade pattern


<a id="orgf83d8df"></a>

### <https://github.com/thoughtbot/bamboo> as an example


<a id="org034da69"></a>

### starts up "fake" server process


<a id="org990b206"></a>

### "fake" server process hard coded to respond with data specific to current test


<a id="org5062b95"></a>

### Can match on "test" header to control server response


<a id="orgc780cc9"></a>

### Provide example: <https://github.com/thoughtbot/bamboo/blob/master/test/lib/bamboo/adapters/mandrill_adapter_test.exs>


<a id="orgfc75248"></a>

### Pros

1.  Can test encoding / decoding of json data

2.  A bit closer to actual production implementation


<a id="org27267fe"></a>

### Cons

1.  Can be a lot of work enumerating possible JSON responses

2.  ARCANA!


<a id="orgef53b14"></a>

## Testing Running Processes


<a id="orgfd143b5"></a>

### Define elixir processes


<a id="orgea78305"></a>

### A bit of boilerplate


<a id="orge42d589"></a>

### Not a big deal, but can be avoided easily with some smart coding


<a id="org33e466e"></a>

### Show example anyway


<a id="orgc6b504c"></a>

## TODO: Come up with name for section. Testing OTHER processes!


<a id="orgdf7f85c"></a>

### BAMBOO PROCESS MAILBOX ASSERT<sub>SEND</sub> WEIRDNESS


<a id="orgc6c541f"></a>

### Explain: <https://github.com/thoughtbot/bamboo/blob/master/lib/bamboo/test.ex>


<a id="org2f15b3d"></a>

### This is very obscure.


<a id="orgbb5e4db"></a>

## Bringing it all together!


<a id="org48a5aed"></a>

### Complex example of facade pattern with Mox complete with tests


<a id="orgd5c5c56"></a>

### Running processes


<a id="orgbe43aee"></a>

### BrewWatcher


<a id="orgfd1a0f9"></a>

### \`fetch ingredients -> put ingredients into pot -> launch brewing process -> start brewing job watcher process  -> Notify on success / failure\`


<a id="orgce08843"></a>

### Have to mock a bunch of different APIs


<a id="org10e737a"></a>

### Architecture graph


<a id="org206b534"></a>

## Other fun stuff


<a id="org41ff969"></a>

### Testing Ecto


<a id="orge63cb38"></a>

### Async / Sync tests, implications of


<a id="orgb13abd7"></a>

### Generating test data

