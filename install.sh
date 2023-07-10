if pwd | grep $NAME; then 
    echo "Ready to install $TAG"
    npm i $TAG -D
else
    echo "You may not be in the $NAME path currently."
fi

