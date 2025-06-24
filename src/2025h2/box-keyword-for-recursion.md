# Box keyword for recursion

| Metadata         |                                                                                  |
|:-----------------|----------------------------------------------------------------------------------|
| Point of contact | @nikomatsakis                                                                    |
| Teams            | <!-- TEAMS WITH ASKS -->                                                         |
| Task owners      | <!-- TASK OWNERS -->                                                             |
| Status           | Proposed                                                                         |
| Tracking issue   |                                                                                  |
| Zulip channel    | N/A (an existing stream can be re-used or new streams can be created on request) |

## Summary

Pursue an experimental implementation and RFC that uses the `box` keyword to enable heap-allocated, recurisve data structures and async functions.

## Motivation

> A lot of things get easier if you are willing to call malloc.
>
>    -- Josh Triplett, at some point.

This project goal proposes a lang-team experiment to extend Rust so it is easier to create heap-allocated data structures. This proposal is aimed at improving Rust code's *clarity of purpose* -- that is, removing noise that makes the intent of Rust code less visible. Recursive data structures and async functions in Rust today require explicit use of heap allocation to break the cycle; this proposal does not change that, but makes the explicit heap allocation much easier to express.

### Easier recursive data structures

Rust data structures are, by default, embedded into the struct or into the containing data structure. This is important for efficiency but inconvenient in a number of common scenarios:

* Recursive types like `struct List { value: u32, next: Option<List> }`.
* Enums with variants of wildly varying size, e.g., `enum Ast { Add(Ast, Ast), Integer(u32) }`

Each of these scenarios in Rust today requires users to manually insert some form of indirection, for example by creating a `Box` or `Rc`. This in turn requires non-local changes to the code.

For enums in particular it would often be useful to be able to box the data in a particular variant, for example:

```rust
enum Ast { Add(Box<(Ast, Ast)>), Integer(u32) }
//             --------------- prefer a single allocation
```

However, this means that pattern matching on the resulting value requires nested `match` statements.

### Easier recursive async functions

Many users encounter the limits on recursive data structures through async functions:

```rust
async fn fibonacci(input: u32) -> u32 {
    match input {
        0 => 1,
        1 => 2,
        _ => fibonacci(input - 1).await + fibonacci(input - 2).await,
    }
}
```

Because async fucntions compile to data structures, the above code will not compile. It is possible to work around this by inserting a `Pin<Box>`:

```rust
fn fibonacci(input: u32) -> impl Future<Output = u32> {
    Box::pin(async move {
        match input {
            0 => 1,
            1 => 2,
            _ => fibonacci(input - 1).await + fibonacci(input - 2).await,
        }
    })
}
```

### The next 6 months

The plan is to explore the use of annotations that permit heap allocation, for example:

* on data structures (struct, enum), indicating that the structure should be heap-allocated;
* on enum variants, indicating that the data for that variant should be heap allocated;
* on async functions, indicating that the closure should be heap-allocated.

The plan is to begin with exploration of Rust code in crates.io and in other sources to try and identify common patterns where heap allocation could be useful.

We will try to identify an initial set of functionality that could be useful. One likely candidate is the `box` keyword, as described in the [Box, Box, Box](https://smallcultfollowing.com/babysteps/blog/2025/03/24/box-box-box/) blog post. Box has the advantage of being a good "default choice" for resolving these kinds of cycles. Unlike other smart pointer types, box conveys ownership, and we already have built-in language rules that support it. The goal would be that data structures declared as `box` transparently use heap-allocation.

### The "shiny future" we are working towards

Convenient annotations that enable users to conveniently build and work with recursive types. The ability to control the form of indirection introduced, e.g., `Box` vs `Rc` vs `Arc` vs something else.

## Design axioms

- **Explicit allocation at declaration, transparent at usage**: The `box` keyword appears where types are declared, but construction and pattern matching work as if the type were not boxed
- **Preserve Rust idioms**: Normal construction syntax, pattern matching, and other Rust patterns should work unchanged
- **Start narrow, expand later**: Focus on `Box<T>` first due to its unique move semantics, with future extension to other smart pointers

## Ownership and team asks

| Task                         | Owner(s) or team(s) | Notes                                                    |
|------------------------------|---------------------|----------------------------------------------------------|
| Lang-team experiment         | ![Team][] [lang]    | Allows experimental implementation before RFC acceptance |
| Author RFC                   | @nikomatsakis       |                                                          |
| Implementation               | ![Help Wanted][]       | Experimental implementation behind feature flag          |
| Standard reviews             | ![Team][] [compiler]| For implementation PRs                                   |
| Lang-team champion           | ![Team][] [lang]    | @nikomatsakis                                                      |
| RFC decision                 | ![Team][] [lang]    |                                                          |

## Frequently asked questions

### Why focus on Box instead of Rc or Arc?

I believe `Box<T>` is the right starting point because it has unique properties that make it most generally applicable:
- It supports move semantics (you can move out of a `Box`)
- It has exclusive ownership, making it semantically closest to direct ownership  
- It's the most commonly used smart pointer for recursive data structures

The design principles here should extend to `Rc` and `Arc`, but I want to start with the most fundamental case and extend to other smart pointers in future work.

Eventually it would be nice to be able to write something like `in(Rc)` to support other forms of allocation. But making a general solution that can work for user-provided pointers is more difficult than supporting box.

### Why was the `box` keyword reserved?

Rust has reserved the `box` keyword since 1.0, but we've never allowed it in stable Rust. The original intention was that the term `box` would be a generic term to refer to any "smart pointer"-like pattern, so `Rc` would be a "reference counted box" and so forth. The `box` keyword would then be a generic way to allocate boxed values of any type; unlike `Box::new`, it would do "emplacement", so that no intermediate values were allocated. With the passage of time I no longer think this is such a good idea.

### How does this relate to other box keyword proposals?

This goal focuses specifically on recursive data structure declarations. Other applications of the `box` keyword (like emplacement with `.box` operator or `box async fn`) are intentionally out of scope and will be addressed by separate efforts focused on pin-init and async-fn-in-dyn-trait.

### What about backwards compatibility?

The `box` keyword is already reserved in Rust, so adding it as a declaration modifier would not break existing code.
