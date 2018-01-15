# Quaternion calculator
A simple quaternion calculator, using tscc to parse input. This example demonstrates how to use operator precedence to resolve conflicts.

## Usage
```shell
node test.js <expression>
```

## Example
```shell
node test.js "exp(1i + 1j) * exp(1k + 1i) / (1 + 1j)"
```