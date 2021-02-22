---
title: "Chart support"
date: 2019-11-18T12:00:06+09:00
description: "Simple yet flexible JavaScript charting for designers & developers"
draft: false
enableToc: false
enableTocContent: false
tags:
-
series:
-
categories:
- diagram
libraries:
- chart
image: images/feature1/graph.png
---
```chart
{
    "type": "pie",
    "backgroundColor" : "#f0f",
    "data": 
       {
        "labels": ["red", "blue"],
        "datasets": [{
            "data": [12, 19]
        }]
    }
}
```

```chart
    {
    "type": "line",
        "data": {
            "labels": ["One", "Two", "Three", "Four", "Five", "Six"],
            "datasets": [
            {
                "label": "# of Votes",
                "data": [12, 19, 3, 5, 2, 3],
                "backgroundColor":"transparent",
                "borderColor":"orange"
            },
            {
                "label": "Some other set",
                "data": [15, 8, 13, 5, 5, 9],
                "backgroundColor":"transparent",
                "borderColor":"#44ccff"
            }
            ]
        }
    }
```
