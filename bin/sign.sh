#!/bin/bash

$1 dgst -sign $2 <(echo -n "$3") | openssl enc -base64